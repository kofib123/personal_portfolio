const http = require("http"); //for  http
const fs = require("fs"); //for reading files
const path = require("path"); //for gathering paths
const express = require("express"); //to use express
const app = express(); //app.use
const bodyParser = require("body-parser"); 
process.stdin.setEncoding("utf8");
app.use(bodyParser.urlencoded({extended:false})); // for sumn idk
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const collect = process.env.MONGO_COLLECTION;
const databaseAndCollection = {db: db, collection: collect};

const { MongoClient, ServerApiVersion } = require('mongodb');

//change this for db
const uri = `mongodb+srv://${userName}:${password}@cluster0.iedhj59.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.use(express.static(__dirname + '/public'));

/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));

/* view/templating engine */
app.set("view engine", "ejs");

const portNumber = 4000;
app.listen(portNumber);
console.log(`Web Server started and running at http://localhost:${portNumber}`);
process.stdout.write("Stop to shutdown the server: ");
process.stdin.on("readable", function() {
    let dataInput = process.stdin.read();
    if (dataInput !== null) { 
        let command = dataInput.trim();
        if (command === "stop") {
            process.exit(0);
        } else {
            console.error(`Invalid Command: ${command}`);
        }
        process.stdin.resume();
    }
});

app.get("/", (req, res) => {
    res.render("index");
});

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailNotification = (formData) => {
  const msg = {
    to: 'boateng.kofi123@gmail.com',
    from: 'portfolio.sender.kofi@gmail.com',
    subject: 'Form Submission Notification',
    text: `A form was submitted with the following data: ${JSON.stringify(formData)}`,
  };

  sgMail
    .send(msg)
    .then(() => {
        console.log('Email sent')
    })
    .catch((error) => {
        console.error(error)
    });
};

async function storeForm(formData) {
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(formData);
        console.log(`User entry created with id ${result.insertedId}`);
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

app.post("/submitted", (req, res) => {
    const formData = req.body;
    sendEmailNotification(formData);
    try {
        storeForm(formData);
    } catch (error) {
        // Handle errors, for example, sending an error response
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
    res.render("submitted");
})