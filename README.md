## Chennai Data Atlas

[![Greenkeeper badge](https://badges.greenkeeper.io/mapmeld/chennai-data-atlas.svg)](https://greenkeeper.io/)

- Upload and display multiple map layers
- Sign-in with Google
- Users can comment on sources

## Install

Pre-requisites: git, NodeJS, MongoDB

```bash
git clone https://github.com/mapmeld/chennai.git chennai-data-portal
cd chennai-data-portal
npm install
```

Set OAuth2 (Google+ API) and Amazon S3 environment variables on Heroku or server

Set S3 bucket permissions to allow public access

Running the app:

```bash
mongod &
npm start
```

## License

Open source under MIT license
