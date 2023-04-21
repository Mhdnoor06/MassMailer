const express = require('express');
const multer = require('multer');
const csvtojson = require('csvtojson');
const path = require('path');
var validator = require('email-validator');
var nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();

const PORT = process.env.PORT || 3500;

app.use(express.static('public'));

// Serve static files
// app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },

  filename: function (req, file, cb) {
    if (!file) {
      const error = new Error('No file uploaded');
      error.status = 400;
      return cb(error);
    }
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.sendFile(path.join('public', 'upload.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
  // console.log(req.file);

  const selectedFile = path.join(__dirname, 'uploads/', req.file.originalname);

  const Processing = (file_path, callback) => {
    //csv parser to convert csv to json or column arrays.

    csvtojson()
      .fromFile(file_path)
      .then((json) => {
        results = json;
        //checking emails column is present in the csv file

        if ('email' in results[0]) {
          //calling back the pared csv object
          callback(results);
        } else {
          res.json({ status: 'error', message: 'Missing Email Column' });
          fs.unlink(file_path, (err) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log('File deleted successfully!');
          });
        }
      });
  };

  valid = [];
  invalid = [];

  //validating emails

  Processing(selectedFile, () => {
    for (let i = 0; i < results.length; i++) {
      const validation = validator.validate(results[i].email);
      if (validation == true) valid.push(results[i].email);
      else invalid.push(results[i].email);
    }

    validated = [];

    len = Math.max(valid.length, invalid.length);

    for (i = 0; i < len; i++) {
      validated.push({ valid: valid[i] || '', invalid: invalid[i] || '' });
      if (validated.valid == '' && validated.invalid == '') break;
    }
    value = res.json({ validated: validated });
  });
  // res.send('File uploaded successfully');
});

app.use(express.json());
// Endpoint to send email
app.post('/send-email', (req, res) => {
  const { email, password, subject, message } = req.body;
  const to_send = valid;

  // Create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password,
    },
  });

  // Setup email data
  const mailOptions = {
    from: email,
    to: to_send,
    subject: subject,
    html: message,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send(error.message);
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Email sent successfully!');
    }
  });
});
// Serve the home page
app.get('/', (req, res) => {
  res.sendFile('public' + '/index.html');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
