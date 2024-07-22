const nodemailer=require('nodemailer')
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt= require('jsonwebtoken')
const path=require('path')
const fs =require('fs')
const { PDFDocument, rgb } = require('pdf-lib');

console.log("hello wodr")

app.use(bodyParser.json());
app.use(cors());

const pdfPath = path.join(__dirname, 'uploads', 'original.pdf');
const imagePath = path.join(__dirname, 'uploads', 'image.png');
const outputPath = path.join(__dirname, 'uploads', 'modified.pdf');

async function addImageToPDF(pdfPath, imagePath, outputPath) {
  // Load the existing PDF
  const existingPdfBytes = fs.readFileSync(pdfPath);
  // console.log("pdfBytes",existingPdfBytes)

  // Load the image
  const imageBytes = fs.readFileSync(imagePath);

  // Create a PDFDocument from the existing PDF
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Embed the image into the PDFDocument
  const image = await pdfDoc.embedPng(imageBytes); // use embedPng or embedJpg depending on your image format

  // Get the last page of the document
  const lastPage = pdfDoc.getPages().slice(-1)[0];

  // Get the image dimensions
  const { width, height } = image.scale(0.1);

  // Define the position where the image will be placed
 const x = 160; 
  const y = 278;

  // Draw the image on the last page
  lastPage.drawImage(image, {
    x,
    y,
    width,
    height,
  });

  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();

  // Write the PDF to a new file
  fs.writeFileSync(outputPath, pdfBytes);
}


addImageToPDF(pdfPath, imagePath, outputPath)
  .then(() => {
    console.log('Image added to the last page of the PDF successfully.');
  })
  .catch((error) => {
    console.error('Error adding image to PDF:', error);
  });


  mongoose.connect('mongodb+srv://mahadevgujju8:SFPaCla5lEsr9HBS@cluster0.gqnbgtq.mongodb.net/second?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

  const User = mongoose.model('User', new mongoose.Schema({
    firstName: {
      type: String,
      required: true,
    
    },
    lastName: {
      type: String,
      required: true,  
    },
    email: {
      type: String,
      required: true
    },
    passWord :{
      type: String,
      required: true
    },
    otp : {
      type: String,
    },
    otpGeneratedAt: {
      type: Date,
    },
    isVerified : {
      type : Boolean
    },
    Role :{
      type : String
    },
    Permissions : {
      type : Array
    }
   
  }));
  const Todos =mongoose.model('Todos',new mongoose.Schema({
 
    title :{
      type: String,
      required: true,
    },
    description : {
      type: String,
      required: true,
    }
  
  }))

  // Middleware to verify JWT token
const verifyToken =async  (req, res, next) => {
  // console.log("header",req.headers)
  // console.log("req",req.originalUrl)
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, 'Yash0000000000000000000000000');
    req.user = decoded;
    const userId=req.user.userId
    // console.log(userId)
    const user=  await User.find({_id : userId})
    // /addTodo
    if(req.originalUrl == "/addTodo"){
   if(!user[0].Permissions.includes('add')){
    console.log("HERREE")
    return res.status(401).json({ message: 'Add Access denied.' });
   }
  }
    //deleteTodo
    if(req.originalUrl == "/deleteTodo"){ 
      if(!user[0].Permissions.includes('delete')){
        return res.send('DN')
      }
    }
   //editTdo
   if(req.originalUrl == "/editTodo"){
    if(!user[0].Permissions.includes('edit')){
      return res.send('EN')
    }
  }
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

  app.post('/register-otp', async (req, res) => {
    try {
     if(req.body.otp == '' && !req.query.isResend){
      const recivedMail=req.body.email
      const oneData =await User.find({email : recivedMail})
      
      if(oneData.length == 0){
      const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
      };

      const newOTP=generateOtp()
      const otpGeneratedAt = new Date();

const transporter = nodemailer.createTransport({
  service :'gmail',
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: "abshyamu@gmail.com",
    pass: "pynk ggjg lpnh saop",
  },
});

const mailOptions ={
  from: '"voitex" <abshyamu@gmail.com>', // sender address
  to: recivedMail, // list of receivers
  subject: "Verification of VOITEX", // Subject line
  text: newOTP, // plain text body
  // html: "<b>Hello world?</b>", // html body
}

const sendmail = async (transporter,mailOptions)=>{
  try {
          await transporter.sendMail(mailOptions)
          console.log("email sent success")
  }
  catch(err){
  console.log(err)
  }
}
sendmail(transporter,mailOptions)
console.log("sent mail success")
      console.log(req.body)

      const newUser=new User({
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        email : req.body.email,
        passWord : req.body.passWord,
        otp : newOTP,
        isVerified : false,
        otpGeneratedAt: otpGeneratedAt,
        Role: req.body.selectedRole
      })
  
    
      await newUser.save()
      res.send("new user saved")
    }
    else{
      
      res.send("duplicateMail")
    }
    
    }
      if(req.body.otp == '' && req.query.isResend){
        
        const generateOtp = () => {
          return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        };
  
        const newOTP=generateOtp()
        const recivedMail=req.body.email
        const oneData =await User.findOne({email : recivedMail})
        oneData.otp=newOTP
        const otpGeneratedAt = new Date();
        oneData.otpGeneratedAt=otpGeneratedAt
        
        const transporter = nodemailer.createTransport({
          service :'gmail',
          host: "smtp.gmail.com",
          port: 587,
          secure: false, // Use `true` for port 465, `false` for all other ports
          auth: {
            user: "abshyamu@gmail.com",
            pass: "pynk ggjg lpnh saop",
          },
        });
        
        const mailOptions ={
          from: '"voitex" <abshyamu@gmail.com>', // sender address
          to: recivedMail, // list of receivers
          subject: "Verification of VOITEX", // Subject line
          text: newOTP, // plain text body
          // html: "<b>Hello world?</b>", // html body
        }
        
        const sendmail = async (transporter,mailOptions)=>{
          try {
                  await transporter.sendMail(mailOptions)
                  console.log("email sent success")
          }
          catch(err){
          console.log(err)
          }
        }
        sendmail(transporter,mailOptions)

        await oneData.save()
        console.log("different otp genereted")
        res.send('ghogho')
      }

    if(req.body.otp != ''){
      console.log(req.body.otp)
      const entereOtp=req.body.otp
      const Email=req.body.email
      const selectedRole=req.body.selectedRole
      const emailWiseData =await User.findOne({email : Email})
      console.log(emailWiseData.otp)
      const currentTime = new Date();
      const otpGeneratedAt = new Date(emailWiseData.otpGeneratedAt);
      const timeDifference = (currentTime - otpGeneratedAt) / 1000; 

      
      if (timeDifference > 30) {
        return res.send("OTP expired");
      }

      if(emailWiseData.otp == entereOtp){
        emailWiseData.otp=''
        emailWiseData.isVerified =true
        await emailWiseData.save()
        res.send("success")
      }
      else{
        res.send("reject")
      }

    }

    } catch (err) {
      res.status(400).send(err);  
    }
  });
 app.post('/login',async (req,res)=>{
  try{

    const { email, password } = req.body;
    // Find the user with the provided email
    console.log(email)
    console.log(password)
    const user = await User.findOne({ email });
    console.log("user  : " ,user)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Check if the password matches
    if (password !== user.passWord) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    // Login successful
    const token = jwt.sign({ userId: user._id }, 'Yash0000000000000000000000000', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', user, token });
  console.log("respond sent")

  }catch(err){

  }
 })
 app.get('/users',async (req,res)=>{
  try{

    if(req.query.searchquery){
      const searchQuery = req.query.searchquery
      console.log(searchQuery)
      const searchRegex = new RegExp(searchQuery, 'i');
      console.log("reg",searchRegex)
      const searchedUser=await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      }) 
      console.log("searched user",searchedUser)
      res.send(searchedUser)
    }
    var limit =5
  
    const page= parseInt(req.query.page) || 1;
    var skip =(page-1)*limit
    const userList= await User.find().skip(skip).limit(5)

  //  console.log(userList)
   res.send(userList)
  }
  catch(err){
    console.log(err)
  }
 })
 app.get('/IdWiseUserdetail',async (req,res)=>{
  try{
    const userId = req.query.Id
    const user= await User.findOne({_id : userId})
    // console.log(user)
    res.send(user)
  }catch(err){
    console.log(err)
  }

 })

app.post('/addPermission',async (req,res)=>{
  try{
    const Id= req.body.Id
    const user=  await User.findOne({_id : Id})
    // console.log("user: " ,user)
    user.Permissions=req.body.permissions
    await user.save()
    res.send("permissions updated")
  }catch(err){
    console.log(err)
  }
})

app.post('/addTodo', async (req, res) => {
  try {
    const { title, description } = req.body;
    const todo = new Todos({ title, description });
    await todo.save();
    res.status(200).json({ message: 'Todo added successfully', todo });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add todo', err });
  }
});

app.get('/getTodos', async (req, res) => {
  try {
    const todos = await Todos.find();
    res.status(200).json( todos );
  } catch (err) {
    res.status(500).json({ message: 'Failed to get todos', err });
  }
});

app.post('/deleteTodo',verifyToken,async (req,res)=>{
try{
  const todoID = req.body.todoID
await Todos.findOneAndDelete({_id : todoID})
res.send("deleted")

}catch(err){
    console.log(err)
}
})
app.post('/editTodo',verifyToken,async (req,res)=>{
  try{
    const todoId=req.body.todoID
    const editedTitle=req.body.editedTitle
    const editedDesc=req.body.editedDesc

    const todo=await Todos.findOne({_id : todoId})
    todo.title=editedTitle
    todo.description=editedDesc
    await todo.save()
    res.send("Edited")
  }catch(err){
    console.log(err)
  }
  

})
app.post('/search',async (req,res)=>{
  try{
      const query = req.body.query
      const user=await User.find({query : query})
      res.send(user)
  }catch(err){

  }
})


app.listen(5000,()=>{
  console.log("listening... at 5000")
})