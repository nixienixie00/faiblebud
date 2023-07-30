# fAIble bud

fAIble bud is an Alexa Skill that allows you to create unique custom fable on demand for the little ones. You specify what moral 
or lesson be learnt and the skill will generate a unique fable for you, complete with a high quality realistic AI generated voice 
narration powered by the ElevenLabs technology.

# Architecture

The Alexa Skill is currently created by VoiceFlow no-code platform. The backend is a NodeJS server whose source code is in this repo
whose primary function is to make calls to the ElevenLabs API to generate the audio narration.

# Testing

Currently the Alexa Skill is in development mode and is not yet published. To test the skill, you need to be added as a beta tester.
Please contact the author to be added as a beta tester.

The full experience can only be tested on an Alexa device. However, you can test the backend server using simple instructions below.

# Alexa Backend Server

The Alexa front end skill (created in Voiceflow) utilizes this backend server to handle the following:

- Synthetizing of text to speech using the Eleven Labs API and returning back an AUDIO data URI


## Prerequisites

- Node.js installed on your machine

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/goldzulu/faiblebud.git
   ```

2. Change to the project directory:

   ```
   cd faiblebud
   ```

3. Install the required dependencies:

   ```
   npm install
   ```

4. Replace `your_api_key_here` in the `.env.template` file with your Eleven Labs API key.

   ```
   ELEVENLABS_API_KEY=your_api_key_here
   PORT=3000
   ```

5. Rename the `.env.template` file to `.env`.


## Running the App

Run the following command in the project directory:

```
npm start
```

The server will start listening on the specified port (default is 3000). You can now make a POST request to the `/synthesize` endpoint with the text and voice settings as input.

## API Endpoint

**POST** `/synthesize`

**Request Body:**

- text(required): The text to synthesize.
- voice (optional): The voice to use for synthesis. Default is '21m00Tcm4TlvDq8ikWAM'.
- voice_settings (optional): An object containing additional voice settings.
  - stability (default: 0)
  - similarity_boost (default: 0)

**Response:**

Returns an object containing the synthesized audio in a data URI format.

```json
{
  "audioDataURI": "data:audio/mpeg;base64,..."
}
```

## Example Request

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"text": "Hello, world!", "voice": "21m00Tcm4TlvDq8ikWAM", "voice_settings": {"stability": 0, "similarity_boost": 0}}' \
  http://localhost:3000/synthesize
```

## Example Response

```json
{
  "audioDataURI": "data:audio/mpeg;base64,//uQZAAAAAAAAAAAAAAAAAAAAA"
}
```

# Glitch.com

For hosting on glitch.com, you can have the git sync automatically.

https://support.glitch.com/t/tutorial-how-to-auto-update-your-project-with-github/8124