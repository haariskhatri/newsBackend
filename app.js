const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fetch = require("node-fetch");
const _ = require("lodash");

const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");

const NewsModel = require('./collections/globals');

mongoose.connect('mongodb+srv://root:Haaris8785@cluster0.walzl.mongodb.net/News').then(()=>{
    console.log("Success");
}).catch((err)=>{
    console.log(err);
})


const app = express();
const adminRoutes = require("./routes/admin");
const { ethers } = require("hardhat");

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/admin", adminRoutes.routes);

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});





app.post("/article", async (req, res) => {
    //const url = "https://www.indiatoday.in/cryptocurrency/story/ftx-founder-bankman-fried-charged-with-paying-forty-million-dollar-bribe-2352755-2023-03-29"; 
    const url = req.body.URL;

    const result = await axios
    .get(url)
    .then(async (response) => {
        const html = response.data;
        const $ = cheerio.load(html);

        // Uses cheerio to extract data from the HTML
        const body = $(
          '*[class*="Story_description"]'
        ).text();

        const title =  $('title').text();
        const final = await summarize(body);
        const div = $(`*[class*="Story_associate__image__bYOH_ topImage"]`);
    
        const imgSrc = div.find('img').attr('src');
        const sentiment = await check(final[0].summary_text);
        const loveIndex = sentiment[0].findIndex(label => label.label == "love");
        const loveScore = sentiment[0][loveIndex].score
        const joyIndex = sentiment[0].findIndex(label => label.label == "joy");
        const joyScore = sentiment[0][joyIndex].score
        const surpriseIndex = sentiment[0].findIndex(label => label.label == "surprise");
        const surpriseScore = sentiment[0][surpriseIndex].score
        const rating = parseFloat(((loveScore + joyScore + surpriseScore)/2 * 10).toFixed(1)) ;
        const category = await getCategory(body);
        console.log(category.labels[0]);
        NewsModel({
          url : url,
          title : title,
          text : final[0].summary_text,
          category : [category.labels[0], category.labels[1]],
          image : imgSrc
        }).save();


    
        res.json({"text":final[0].summary_text, "sentiment" : sentiment,rating:rating });


});
        
}
);


async function summarize(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}


async function getCategory(data){
  const response = await fetch(
		"https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify({inputs:data, parameters:{candidate_labels:["India","Global","Sports","Tech"]}})
		}
	);
	const result = await response.json();
	return result;
}

async function checking(data){

}

async function check(data){
  // const response = await fetch(
  //   "https://api-inference.huggingface.co/models/bhadresh-savani/distilbert-base-uncased-emotion",
  //   {
  //     headers: {
  //       Authorization: "Bearer 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",
  //     },
  //     method: "POST",
  //     body: {input : data , candidate_label : [""]},
  //   }
  // );
  // const result = await response.json();
  // console.log(result)
  // return result;
  const response = await fetch(
		"https://api-inference.huggingface.co/models/bhadresh-savani/distilbert-base-uncased-emotion",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}


app.listen(4000);