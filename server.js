var express =require('express');
var mongodb = require('mongodb')
var bodyParser = require('body-parser');
var cors = require('cors')
var monk = require('monk')

var port = process.env.PORT || 8080;

var app = express();
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())


// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));
// }
// const mongoURI = 'mongodb://heroku_7kjfrlfk:g64o6j6cfuua16gfvi2q5mu8vg@ds157702.mlab.com:57702/heroku_7kjfrlfk'
const mongoURI = process.env.MONGODB_URI;

const dbUrl = mongoURI || 'mongodb://localhost/crudwithredux';

function validate(data) {

  let errors = {};
  if (data.org === '') errors.org = "Cannot be empty";
  if (data.logo === '') errors.logo = "Cannot be empty";
  if (data.url === '') errors.url = "Cannot be empty";
  if (data.desc === '') errors.desc = "Cannot be empty";



  const isValid = Object.keys(errors).length === 0
  return { errors, isValid };
}

// app.use(cors())

mongodb.MongoClient.connect(dbUrl, function(err, db) {

  app.get('/api/orgs', (req,res) => {
      db.collection('orgs').find({}).toArray((err, orgs) => {
        res.json({ orgs });
      });
  });

  app.post('/api/orgs', (req,res) => {
    const { errors, isValid } = validate(req.body);
    if (isValid) {
      const { org, logo, url, desc } = req.body;
      db.collection('orgs').insert({ org, logo, url, desc }, (err, result) => {
        if (err) {
          res.status(500).json({ errors: { global: "Something went wrong"}})
        } else {
          res.json({ org: result.ops[0] })
        }
      })
    } else {
      res.status(400).json({ errors });
    }
  })

  app.put('/api/orgs/:_id', (req, res) => {
    const { errors, isValid } = validate(req.body);

    if (isValid) {
      const { org, logo, url, desc } =req.body;
      db.collection('orgs').findOneAndUpdate(
        { _id: new mongodb.ObjectId(req.params._id) },
        { $set: { org, logo, url, desc } },
        { returnOriginal: false },
        (err, result) => {
          if (err) { res.status(500).json({ errors: { global: err}}); return; }

          res.json({ org: result.value });
        }
      )
    } else {
      res.status(400).json({ errors })
    }
  })

  app.get('/api/orgs/:_id', (req, res) => {
    db.collection('orgs').findOne({ _id: new mongodb.ObjectId(req.params._id) }, (err, org) => {
      res.json({ org })
    })
  })

  app.delete('/api/orgs/:_id', (req, res) => {
    db.collection('orgs').deleteOne({ _id: new mongodb.ObjectId(req.params._id) }, (err, r) => {
      if (err) { res.status(500).json({ errors: { global: err}}); return; }

      res.json({});
    })
  });

  app.use((req, res) => {
    res.status(404).json({
      errors: {
        global: "Still working on it. Please try again later."
      }
    })
  })

  app.listen(process.env.PORT || 8080, () => console.log('Server on localhost:8080'))

})
