// MIT. Standalone, stdin/stdout-only raster codec. No network or user-file APIs.
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use image::{DynamicImage, GenericImageView, ImageDecoder, ImageFormat, ImageReader};
use moxcms::{ColorProfile, DataColorSpace, Layout, TransformOptions};
use serde_json::{json, Value};
use std::io::{self, Cursor, Read};
const MAX_INPUT: u64 = 128 * 1024 * 1024;
fn need(ok: bool) -> Result<(), String> {
    if ok {
        Ok(())
    } else {
        Err("INVALID_IMAGE_REQUEST".into())
    }
}
fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}
fn pages(b: &[u8], f: ImageFormat) -> Result<u32, String> {
    if f == ImageFormat::Gif {
        need(b.len() >= 13)?;
        let mut i = 13usize;
        if b[10] & 128 != 0 {
            i += 3usize << (usize::from(b[10] & 7) + 1)
        };
        let mut n = 0;
        while i < b.len() {
            let tag = b[i];
            i += 1;
            match tag {
                0x3b => return Ok(n.max(1)),
                0x2c => {
                    need(i + 9 <= b.len())?;
                    let p = b[i + 8];
                    i += 9;
                    if p & 128 != 0 {
                        i += 3usize << (usize::from(p & 7) + 1)
                    };
                    need(i < b.len())?;
                    i += 1;
                    n += 1;
                }
                0x21 => {
                    need(i < b.len())?;
                    i += 1;
                }
                _ => return Err("INVALID_GIF_BLOCK".into()),
            };
            loop {
                need(i < b.len())?;
                let len = usize::from(b[i]);
                i += 1;
                if len == 0 {
                    break;
                };
                i = i.checked_add(len).ok_or("INVALID_GIF_LENGTH")?;
                need(i <= b.len())?
            }
        }
        return Err("TRUNCATED_GIF".into());
    }
    if f == ImageFormat::Png {
        let mut i = 8usize;
        while i + 12 <= b.len() {
            let l = u32::from_be_bytes(b[i..i + 4].try_into().unwrap()) as usize;
            if &b[i + 4..i + 8] == b"acTL" {
                need(l >= 8 && i + 12 + l <= b.len())?;
                return Ok(u32::from_be_bytes(b[i + 8..i + 12].try_into().unwrap()).max(1));
            };
            i = i.checked_add(12 + l).ok_or("INVALID_PNG_LENGTH")?;
        }
    }
    if f == ImageFormat::WebP {
        let mut i = 12usize;
        let mut n = 0;
        while i + 8 <= b.len() {
            let l = u32::from_le_bytes(b[i + 4..i + 8].try_into().unwrap()) as usize;
            if &b[i..i + 4] == b"ANMF" {
                n += 1
            };
            i = i
                .checked_add(8 + l + (l & 1))
                .ok_or("INVALID_WEBP_LENGTH")?;
        }
        return Ok(n.max(1));
    }
    Ok(1)
}
fn png_comments(b: &[u8]) -> bool {
    let mut i = 8usize;
    while i + 12 <= b.len() {
        let l = u32::from_be_bytes(b[i..i + 4].try_into().unwrap()) as usize;
        if matches!(&b[i + 4..i + 8], b"tEXt" | b"zTXt" | b"iTXt") {
            return true;
        };
        match i.checked_add(12 + l) {
            Some(n) => i = n,
            None => return true,
        }
    }
    false
}
fn jpeg_cmyk(b: &[u8]) -> bool {
    let mut d = zune_jpeg::JpegDecoder::new(zune_core::bytestream::ZCursor::new(b));
    d.decode_headers().is_ok()
        && matches!(
            d.input_colorspace(),
            Some(zune_core::colorspace::ColorSpace::CMYK | zune_core::colorspace::ColorSpace::YCCK)
        )
}
fn run(v: Value) -> Result<Value, String> {
    let input = v["data"].as_str().ok_or("INPUT_REQUIRED")?;
    let b = B64.decode(input).map_err(err)?;
    need(!b.is_empty() && b.len() as u64 <= MAX_INPUT)?;
    let f = image::guess_format(&b).map_err(err)?;
    need(matches!(
        f,
        ImageFormat::Png | ImageFormat::Jpeg | ImageFormat::Gif | ImageFormat::WebP
    ))?;
    let name = match f {
        ImageFormat::Png => "png",
        ImageFormat::Jpeg => "jpeg",
        ImageFormat::Gif => "gif",
        _ => "webp",
    };
    let mut decoder = ImageReader::with_format(Cursor::new(&b), f)
        .into_decoder()
        .map_err(err)?;
    let (w, h) = decoder.dimensions();
    need(w > 0 && h > 0)?;
    let color = decoder.color_type();
    let depth = if color.bits_per_pixel() / u16::from(color.channel_count()) > 8 {
        "ushort"
    } else {
        "uchar"
    };
    let orientation = decoder.orientation().map_err(err)?;
    let exif = decoder.exif_metadata().map_err(err)?;
    let icc = decoder.icc_profile().map_err(err)?;
    let xmp = decoder.xmp_metadata().map_err(err)?;
    let iptc = decoder.iptc_metadata().map_err(err)?;
    let cmyk = f == ImageFormat::Jpeg && jpeg_cmyk(&b);
    let space = if cmyk {
        "cmyk"
    } else if color.channel_count() <= 2 {
        if depth == "ushort" {
            "grey16"
        } else {
            "b-w"
        }
    } else if depth == "ushort" {
        "rgb16"
    } else {
        "srgb"
    };
    let mut metadata = json!({"format":name,"width":w,"height":h,"pages":pages(&b,f)?,"depth":depth,"space":space,"hasAlpha":color.has_alpha()||f==ImageFormat::Gif,"hasProfile":icc.is_some()});
    for (k, present) in [
        ("exif", exif.is_some()),
        ("icc", icc.is_some()),
        ("xmp", xmp.is_some()),
        ("iptc", iptc.is_some()),
        ("comments", f == ImageFormat::Png && png_comments(&b)),
    ] {
        if present {
            metadata[k] = json!(true)
        }
    }
    if orientation.to_exif() != 1 {
        metadata["orientation"] = json!(orientation.to_exif())
    }
    if v["op"] == "metadata" {
        return Ok(metadata);
    }
    need(u64::from(w) * u64::from(h) <= 268_435_456)?;
    let mut img = DynamicImage::from_decoder(decoder).map_err(err)?;
    if v["op"] == "validate" {
        return Ok(json!({"decoded":true,"width":w,"height":h}));
    }
    if v["srgb"].as_bool().unwrap_or(false) {
        if let Some(profile) = icc.or_else(|| {
            cmyk.then(|| {
                include_bytes!(
                    "../third_party/compact-icc-profiles/profiles/CGATS001Compat-v2-micro.icc"
                )
                .to_vec()
            })
        }) {
            let profile = ColorProfile::new_from_slice(&profile).map_err(err)?;
            let (layout, raw) = match profile.color_space {
                DataColorSpace::Rgb => (Layout::Rgba, img.to_rgba8().into_raw()),
                DataColorSpace::Gray => (Layout::Gray, img.to_luma8().into_raw()),
                DataColorSpace::Cmyk => {
                    let mut d = jpeg_decoder::Decoder::new(Cursor::new(&b));
                    let raw = d.decode().map_err(err)?;
                    need(
                        d.info()
                            .is_some_and(|i| i.pixel_format == jpeg_decoder::PixelFormat::CMYK32),
                    )?;
                    (Layout::Rgba, raw)
                }
                _ => return Err("UNSUPPORTED_ICC_COLORSPACE".into()),
            };
            let mut out = vec![0u8; (u64::from(w) * u64::from(h) * 4) as usize];
            let tr = profile
                .create_transform_8bit(
                    layout,
                    &ColorProfile::new_srgb(),
                    Layout::Rgba,
                    TransformOptions::default(),
                )
                .map_err(err)?;
            tr.transform(&raw, &mut out).map_err(err)?;
            img = DynamicImage::ImageRgba8(
                image::RgbaImage::from_raw(w, h, out).ok_or("ICC_RESULT_LENGTH")?,
            );
        }
    }
    if v["rotate"].as_bool().unwrap_or(false) {
        img.apply_orientation(orientation)
    }
    let (iw, ih) = img.dimensions();
    let tw = v["width"].as_u64().unwrap_or(u64::from(iw));
    let th = v["height"].as_u64().unwrap_or(u64::from(ih));
    need(tw > 0 && th > 0 && tw <= u32::MAX as u64 && th <= u32::MAX as u64)?;
    let mut scale = (tw as f64 / iw as f64).min(th as f64 / ih as f64);
    if v["withoutEnlargement"].as_bool().unwrap_or(false) {
        scale = scale.min(1.0)
    };
    // When only one side was supplied, the other bound is unbounded, not the original size.
    let width = v["width"].as_u64();
    let height = v["height"].as_u64();
    if width.is_some() && height.is_none() {
        scale = width.unwrap() as f64 / iw as f64
    };
    if height.is_some() && width.is_none() {
        scale = height.unwrap() as f64 / ih as f64
    };
    if v["withoutEnlargement"].as_bool().unwrap_or(false) {
        scale = scale.min(1.0)
    };
    let ow = ((iw as f64 * scale).round() as u32).max(1);
    let oh = ((ih as f64 * scale).round() as u32).max(1);
    need(u64::from(ow) * u64::from(oh) <= 268_435_456)?;
    if ow != iw || oh != ih {
        img = img.resize_exact(ow, oh, image::imageops::FilterType::Lanczos3)
    }
    let quality = v["quality"].as_u64().unwrap_or(85).clamp(1, 100) as u8;
    let output = if v["format"] == "webp" {
        let rgba = img.to_rgba8();
        {
            let mut config = webp::WebPConfig::new().map_err(|_| "WEBP_CONFIG")?;
            config.quality = quality as f32;
            config.method = 0;
            webp::Encoder::from_rgba(rgba.as_raw(), ow, oh)
                .encode_advanced(&config)
                .map_err(|_| "WEBP_ENCODE")?
                .to_vec()
        }
    } else {
        let rgb = img.to_rgb8();
        let mut data = Vec::new();
        image::codecs::jpeg::JpegEncoder::new_with_quality(&mut data, quality)
            .encode_image(&rgb)
            .map_err(err)?;
        data
    };
    Ok(json!({"data":B64.encode(output),"info":{"width":ow,"height":oh}}))
}
fn main() {
    let mut b = Vec::new();
    let result = io::stdin()
        .take(MAX_INPUT + 1)
        .read_to_end(&mut b)
        .map_err(err)
        .and_then(|_| {
            need(b.len() as u64 <= MAX_INPUT)?;
            let v = serde_json::from_slice(&b).map_err(err)?;
            run(v)
        });
    match result {
        Ok(v) => println!("{}", v),
        Err(_) => {
            eprintln!("PERMISSIVE_IMAGE_CODEC_REJECTED");
            std::process::exit(2)
        }
    }
}
