const fs = require('fs');
const path = require('path');

const getByteData = (request, response, stats) => {
  let { range } = request.headers;

  if (!range) {
    range = 'bytes=0-';
  }

  const positions = range.replace(/bytes=/, '').split('-');

  let start = parseInt(positions[0], 10);

  const total = stats.size;
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

  if (start > end) {
    start = end - 1;
  }

  const byteData = {
    start,
    end,
    total,
  };

  return byteData;
};

const loadFile = (request, response, filePath, mediaType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    // get byte data here
    const byteData = getByteData(request, response, stats);
    const chunkSize = (byteData.end - byteData.start) + 1;

    response.writeHead(206, {
      'Content-Range': `bytes ${byteData.start}-${byteData.end}/${byteData.total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mediaType,
    });

    const stream = fs.createReadStream(file, { start: byteData.start, end: byteData.end });

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  });
};

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
