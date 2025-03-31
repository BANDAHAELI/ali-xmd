const Jimp = require("jimp");

async function generateProfilePicture(buffer) {
	const jimp = await Jimp.read(buffer);
	const min = jimp.getWidth();
	const max = jimp.getHeight();
	const cropped = jimp.crop(0, 0, min, max);
	return {
		img: await cropped.scaleToFit(324, 720).getBufferAsync(Jimp.MIME_JPEG),
		preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG)
	};
}

async function updatefullpp(jid, imag, client) {
	const {
		query
	} = client;
	const {
		img
	} = await generateProfilePicture(imag);
	await query({
		tag: "iq",
		attrs: {
			to: "@s.whatsapp.net",
			type: "set",
			xmlns: "w:profile:picture"
		},
		content: [{
			tag: "picture",
			attrs: {
				type: "image"
			},
			content: img
		}]
	});
}


module.exports = {updatefullpp};
