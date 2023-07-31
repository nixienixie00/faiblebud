require('dotenv').config()
const express = require('express')
const axios = require('axios')
const cmd = require("node-cmd")
const app = express()
const port = process.env.PORT || 3000

const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk');
const fs = require('fs');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const version = "1.0.0"
const S3 = new AWS.S3();
const tmp = require('tmp');

// Function to transcode audio to meet Alexa's requirements
async function transcodeAudio(inputBuffer) {
  return new Promise((resolve, reject) => {
    const outputBuffer = [];

    // Write buffer to a temporary file
    const tempFile = tmp.fileSync({ postfix: '.mp3' });
    fs.writeFileSync(tempFile.name, inputBuffer);

    ffmpeg()
      .input(tempFile.name)  // Pass the file path to ffmpeg
      .audioCodec('libmp3lame')
      .audioBitrate(48)
      .audioFrequency(16000)
      .output('pipe:1')  // Output to stdout
      .outputFormat('mp3')
      .on('error', (err) => {
        tempFile.removeCallback();  // Delete the temporary file
        reject(err);
      })
      .on('data', (chunk) => outputBuffer.push(chunk))
      .on('end', () => {
        tempFile.removeCallback();  // Delete the temporary file
        resolve(Buffer.concat(outputBuffer));
      })
      .run();
  });
}

app.use(express.json())

app.post('/synthesizeurl', async (req, res) => {
  const text = req.body.text

  if (!text) {
    res.status(400).send({ error: 'Text is required.' })
    return
  }

  const voice =
    req.body.voice == 0
      ? '21m00Tcm4TlvDq8ikWAM'
      : req.body.voice || '21m00Tcm4TlvDq8ikWAM'

  const voice_settings =
    req.body.voice_settings == 0
      ? {
          stability: 0,
          similarity_boost: 0,
        }
      : req.body.voice_settings || {
          stability: 0,
          similarity_boost: 0,
        }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        text: text,
        voice_settings: voice_settings,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          accept: 'audio/mpeg',
          'xi-api-key': `${process.env.ELEVENLABS_API_KEY}`,
        },
        responseType: 'arraybuffer',
      }
    )

    const audioBuffer = Buffer.from(response.data, 'binary');
    const transcodedAudioBuffer = await transcodeAudio(audioBuffer);

    // Check if the transcoded audio buffer is empty
    if (transcodedAudioBuffer.length === 0) {
      throw new Error('Transcoding failed: the transcoded audio buffer is empty.');
    }

    // Generate a random file name.
    const fileName = `${Date.now()}.mp3`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: transcodedAudioBuffer,
      ACL: 'public-read',  // make file publicly accessible
      ContentType: 'audio/mpeg'
    };

    const data = await S3.upload(params).promise();
    res.send({ audioUrl: data.Location });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while processing the request.');
  }
});


app.get('/', (req, res) => {
  res.send('Welcome to fAIble bud!' + " v." + version)
})

// For github sync integration and self updating on push
app.post('/git', (req, res) => {
  // If event is "push"
  if (req.headers['x-github-event'] == "push") {
    cmd.runSync('chmod 777 git.sh'); /* :/ Fix no perms after updating */
    cmd.run('./git.sh', (err, data) => {  // Run our script
      if (data) console.log(data);
      if (err) console.log(err);
    });
    cmd.run('refresh');  // Refresh project
  
    console.log("> [GIT] Updated with origin/main");
  }

  return res.sendStatus(200); // Send back OK status
});

app.post('/synthesize', async (req, res) => {
  const text = req.body.text

  // Updated this based on Elias feedback
  // As this change will allow the user to pass 0 as a value, if no text is set in the text variable,
  // text will be 0 and the condition will be false so "0" will be used to do TTS.

  // Previous condition
  // if (text === undefined || text === null || text === '' || text == 0) {

  if (!text) {
    res.status(400).send({ error: 'Text is required.' })
    return
  }

  const voice =
    req.body.voice == 0
      ? '21m00Tcm4TlvDq8ikWAM'
      : req.body.voice || '21m00Tcm4TlvDq8ikWAM'

  const voice_settings =
    req.body.voice_settings == 0
      ? {
          stability: 0,
          similarity_boost: 0,
        }
      : req.body.voice_settings || {
          stability: 0,
          similarity_boost: 0,
        }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        text: text,
        voice_settings: voice_settings,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          accept: 'audio/mpeg',
          'xi-api-key': `${process.env.ELEVENLABS_API_KEY}`,
        },
        responseType: 'arraybuffer',
      }
    )

    const audioBuffer = Buffer.from(response.data, 'binary')
    const base64Audio = audioBuffer.toString('base64')
    const audioDataURI = `data:audio/mpeg;base64,${base64Audio}`
    res.send({ audioDataURI })
  } catch (error) {
    console.error(error)
    res.status(500).send('Error occurred while processing the request.')
  }
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
