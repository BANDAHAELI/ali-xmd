const {getBuffer} = require('./utils');
const {default: axios} = require("axios");
const fs = require('fs');
const fetch = require('node-fetch');
const ffmpeg = require('fluent-ffmpeg');
const ID3Writer = require('browser-id3-writer');
const { ImgurClient } = require('imgur');
const os = require('os');
const path = require('path');
const webp = require('node-webpmux')


async function createTmpFile(fileBuffer, extension) {
	const dir = os.tmpdir();
	const tmpFilePath = path.join(dir, `tempfile-${Date.now()}.${extension}`);
	await fs.writeFileSync(tmpFilePath, fileBuffer);
	return tmpFilePath;
}


async function createFile(extension) {
	const dir = os.tmpdir();
	const tmpFileName = `tempfile-${Date.now()}.${extension}`;
	const tmpFilePath = path.join(dir, tmpFileName);
	return tmpFilePath;
}


async function addStickerMetaData(stickerBuffer, options) {
	const img = new webp.Image();
	const {
		packName,
		authorName,
		categories
	} = options;
	const stickerPackId = [...Array(32)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
	const json = {
		'sticker-pack-id': stickerPackId,
		'sticker-pack-name': (options.packName || ''),
		'sticker-pack-publisher': (options.authorName || ''),
		'emojis': (options.categories || ['💖']),
		'android-app-store-link': 'https://github.com/KichuExe',
		'ios-app-store-link': 'https://github.com/KichuExe'
	};
	let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
	let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
	let exif = Buffer.concat([exifAttr, jsonBuffer]);
	exif.writeUIntLE(jsonBuffer.length, 14, 4);
	await img.load(stickerBuffer)
	img.exif = exif
	return await img.save(null)
}


async function addExifToWebP(buffer, options) {
	const outputFilePath = await createFile('webp');
	const inputFilePath = await createTmpFile(buffer, "webp");
	if (options.packName || options.authorName) {
		const img = new webp.Image();
		const json = {
			"sticker-pack-id": `https://github.com/KichuExe`,
			"sticker-pack-name": options.packName,
			"sticker-pack-publisher": options.authorName,
			emojis: options.categories ? options.categories : [""]
		};
		const exifAttr = await Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
		const jsonBuff = await Buffer.from(JSON.stringify(json), "utf-8");
		const exif = await Buffer.concat([exifAttr, jsonBuff]);
		await exif.writeUIntLE(jsonBuff.length, 14, 4);
		await img.load(inputFilePath);
		img.exif = exif;
		await img.save(outputFilePath);
		const stickerBuffer = fs.readFileSync(outputFilePath);
		return stickerBuffer;
	}
}


async function imageToWebP(buffer, exif) {
	const outputFilePath = await createFile('webp');
	const inputFilePath = await createTmpFile(buffer, "jpg");
	await new Promise((resolve, reject) => {
		ffmpeg(inputFilePath).on('error', (err) => {
			console.error('Error during conversion:', err);
			reject(err);
		}).on('end', () =>
			resolve(true)).addOutputOptions(['-vcodec', 'libwebp', "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"]).toFormat('webp').save(outputFilePath);
	});
	const buff = fs.readFileSync(outputFilePath);
	fs.unlinkSync(outputFilePath);
	fs.unlinkSync(inputFilePath);
	if (!exif) {
		return buff;
	} else {
		return await addStickerMetaData(buff, {
			packName: exif.packName,
			authorName: exif.authorName
		});
	}
}


async function videoToWebP(buffer, exif) {
	const outputFilePath = await createFile('webp');
	const inputFilePath = await createTmpFile(buffer, "mp4");
	await new Promise((resolve, reject) => {
		ffmpeg(inputFilePath).on('error', (err) => {
			console.error('Error during conversion:', err);
			reject(err);
		}).on('end', () =>
			resolve(true)).addOutputOptions(["-vcodec", "libwebp", "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse", "-loop", "0", "-ss", "00:00:00", "-t", "00:00:05", "-preset", "default", "-an", "-vsync", "0"]).toFormat('webp').save(outputFilePath);
	});
	const buff = fs.readFileSync(outputFilePath);
	fs.unlinkSync(outputFilePath);
	fs.unlinkSync(inputFilePath);
	if (!exif) {
		return buff;
	} else {
		return await addStickerMetaData(buff, {
			packName: exif.packName,
			authorName: exif.authorName
		});
	}
}


async function convertToMp4(buffer) {
	const inputFilePath = await createTmpFile(buffer, 'mp3');
	const outputFilePath = await createFile('mp4');
	await new Promise((resolve, reject) => {
		ffmpeg(inputFilePath).addOptions(["-y", "-i", inputFilePath, "-c:v", "libx264", "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-crf", "32", "-preset", "slow", "-shortest"])
			.on('error', (err) => {
				console.error('Error during conversion:', err);
				reject(err);
			})
			.on('end', () => {
				resolve(true);
			})
			.save(outputFilePath);
	});
	const outputBuffer = fs.readFileSync(outputFilePath);
	fs.unlinkSync(inputFilePath);
	fs.unlinkSync(outputFilePath);
	return outputBuffer;
}


async function convertToMp3(buffer) {
	const inputFilePath = await createTmpFile(buffer, 'mp4');
	const outputFilePath = await createFile('mp3');
	await new Promise((resolve, reject) => {
		ffmpeg(inputFilePath).addOptions(["-y", "-i", inputFilePath, "-vn", "-ac", "2", "-b:a", "128k", "-ar", "44100", "-f", "mp3"])
			.on('error', (err) => {
				console.error('Error during conversion:', err);
				reject(err);
			}).on('end', () =>
				resolve(true)).save(outputFilePath);
	});
	const outputBuffer = fs.readFileSync(outputFilePath);
	fs.unlinkSync(inputFilePath);
	fs.unlinkSync(outputFilePath);
	return outputBuffer;
}


async function appendMp3Data(audioBuffer, coverBuffer, options = {
	title: `X-BOT-MD`,
	artist: ""
}) {
	const writer = new ID3Writer(await convertToMp3(audioBuffer));
	writer
		.setFrame("TIT2", options.title)
		.setFrame('TPE1', [`${options.artist}`])
		.setFrame('TALB', ' ')
                .setFrame('TYER', 2004)
		.setFrame("APIC", {
                       type: 3,
                       data: Buffer.isBuffer(coverBuffer) ? coverBuffer : await getBuffer(coverBuffer),
		       description: "X-BOT-MD",
                });
	writer.addTag();
	return Buffer.from(writer.arrayBuffer);
}


async function mediaToUrl(buffer, m) {
	const client = new ImgurClient({
		clientId: "a0113354926015a"
	});
	let url;
	try {
		let {
			mime,
			data
		} = await m.getFile(buffer);
		if (mime.startsWith("audio")) {
			data = await convertToMp4(buffer);
			mime = "video/mp4";
		}
		const filePath = await createTmpFile(data, mime.split("/")[0]);
			const imgurRes = await client.upload({
				image: fs.createReadStream(filePath),
				type: 'stream',
			});
		if (imgurRes.data === "Imgur is temporarily over capacity. Please try again later.") {
				const base64 = buffer.toString('base64');
			const imgbbRes = await axios.post(
				"https://api.imgbb.com/1/upload",
				new URLSearchParams({
					key: "aa4a595a2e4f73a44ca2e317f01c035b",
					image: base64,
				}), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
					},
				});
			if (!imgbbRes || !imgbbRes.data || !imgbbRes.data.data.url) {
				throw new Error("imgbb upload did not return a valid URL");
			}
				url = imgbbRes.data.data.url;
			} else {
			url = imgurRes.data.link;
			}
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
			return url;
	} catch (e) {
		console.error("Error in mediaToUrl:", e);
		return null;
	}
}


module.exports = {createTmpFile, createFile, addExifToWebP, imageToWebP, videoToWebP, convertToMp4, convertToMp3, getBuffer, appendMp3Data, mediaToUrl};
