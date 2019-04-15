var express = require("express");
var app = express();
var mongoose=require("mongoose");
mongoose.connect("mongodb://localhost/newchatapp"); 
var port=3000;

var bodyParser=require("body-parser");
app.use( bodyParser.urlencoded( {extended : true } ) );

var request = require("request");

app.use(express.static("Public") );
app.set("view engine","ejs"); 

var userSchema = new mongoose.Schema({
	username : String ,
	email : String ,
	password : String,
	assign : 0
});

var User = mongoose.model("user",userSchema);
var agentSchema = new mongoose.Schema({
	username : String ,
	email : String ,
	password : String,
	assign : 0
});

var Agent = mongoose.model("agent",agentSchema);

// Agent.create({ email : "ayush@gmail.com" , username : "ayush" , password : "ayush"},function(err,agent){
// 	console.log(agent);
// });

var waitinglistSchema = new mongoose.Schema({
	cid : String,
	chat : Array

});

var Waitinglist = mongoose.model("waitinglist",waitinglistSchema);

var agentlistSchema = new mongoose.Schema({
	cid : String,
	aid :String,
	chat : Array

});

var Agentlist = mongoose.model("agentlist", agentlistSchema);

app.get("/",function(req,res){

	res.redirect("/login");
});

app.get("/login",function(req,res){

	res.render("login");
});
app.get("/login/agent",function(req,res){

	res.render("loginagent");
});
app.get("/signup",function(req,res){

	res.render("signup");
});

app.post("/signup",function(req,res){
	if(req.body.password1!==req.body.password2){
		res.send("Password do not match.");
	}
else{
	User.find({ email : req.body.email },function(err,user){
		if(err)
			console.log(err);
		else{
			if(!(user.length))
			{
				User.find({username : req.body.username},function(err, user1){
					if(err)
						console.log(err);
					else
						{
							if(!(user1.length))
							{
								var id;
								User.create( 
								{
									username : req.body.username ,
									email : req.body.email,
									password : req.body.password1,
									assign : 0
								},function(err, newuser){
									if(err){
										console.log(err); 
									}
									else{
										console.log(err);
										console.log("User added successfully");
										id = newuser._id.toString();
										id="/chats/client/" + id;
										res.redirect("/");
									}
								});
							}
							else
								res.send("An account with this username already exists.")	
						}
				});			
			}
			else{
				res.send("An account with this Email address already exists.");
			}
		}		
	});
}		
});
// Agentlist.find({ aid : "5cb35c47816a280a1ecbec18" },function(err,some){
// 	console.log(some);
// });
app.post("/login",function(req,res){
	
	User.find({ email : req.body.email , password : req.body.password },function(err,user){
	if(err)
		console.log(err);
	else{
		if(!(user.length))
			res.send("Invalid Credentials");
		else{
			var id =  user[0]._id.toString();
			Waitinglist.create( { cid : id , chat : [] } , function(err,some){

				console.log(some);
			});
			res.redirect("/chats/client/"+id);
		}

	}

	});

});


app.post("/login/agent",function(req,res){
	
	Agent.find({ email : req.body.email , password : req.body.password },function(err ,agent2){
	if(err)
		console.log(err);
	else{
		if(!(agent2.length))
			res.send("Invalid Credentials");
		else{
					
			var id = agent2[0]._id.toString();
			Agentlist.create( { aid : id , cid : 0 , chat : [] } , function(err,some){
				console.log(some);
			});
			res.redirect("/chats/agent/"+id);
		}
	}
	});
});
app.get("/chats/agent/:id",function(req,res){

Agentlist.find({ aid : req.params.id},function(err , query){
		if(err)
			console.log(err);
		else
		{
			res.render("agent",{ chat : query[0].chat , id : req.params.id});
		}
	});
});
app.get("/chats/agent/:id/mssg",function(req,res){

	Agentlist.find( { aid : req.params.id},function(err,agent){
		if(agent[0].cid==0)
		{
			Waitinglist.find({},function(err,user){
				if(user.length==0)
					res.send({ connected : false });
				else
					{
						agent[0].cid = user[0].cid;
						agent[0].chat=user[0].chat;
						Agentlist.updateOne({_id : agent[0]._id},agent[0],function(err,result){});
						Waitinglist.deleteOne({ cid : user[0].cid },function(err,some){});
						res.send({connected : true , messages : agent[0].chat});
					}		
			});
			
		}
		else
		{

			res.send({connected : true , messages : agent[0].chat });
		}
	});
		
});

app.post("/chats/agent/:id",function(req,res){
console.log("aid is "+ req.params.id);
Agentlist.find({ aid : req.params.id },function(err , query){
		if(err)
			console.log(err);
		else{
			var n=query[0].chat.length;
			query[0].chat[n]={
				sender : "agent",
				message : req.body.message 
			} ;
			Agentlist.updateOne({_id : query[0]._id },query[0],function(err,result){});
		res.redirect("/chats/agent/"+req.params.id);
		}
	});

});

app.get("/chats/client/:id",function(req,res){

	Agentlist.find({ cid : req.params.id},function(err , query){
		if(err)
			console.log(err);
		else
		{
			if(query.length!=0)
			{
				res.render("client",{ chat :  query[0].chat , id:req.params.id});
			}
			else
			{
				Waitinglist.find({cid : req.params.id }, function(err,query2){
				
				if(err)
					console.log(err);	
				else
				{
					res.render("client",{ chat : query2[0].chat , id : req.params.id });
				}
				
				});
			}
		}
	});
});


app.get("/chats/agent/:id/mssg",function(req,res){

	Agentlist.find( { aid : req.params.id},function(err,agent){
		if(agent[0].cid==0)
		{
			Waitinglist.find({},function(err,user){
				if(user.length==0)
					res.send({ connected : false });
				else
					{
						agent[0].cid = user[0].cid;
						agent[0].chat=user[0].chat;
						Agentlist.updateOne({_id : agent[0]._id},agent[0],function(err,result){});
						Waitinglist.deleteOne({ cid : user[0].cid },function(err,some){});
						res.send({connected : true , messages : agent[0].chat});
					}		
			});
			
		}
		else
		{

			res.send({connected : true , messages : agent[0].chat });
		}
	});
		
});

app.get("/chats/client/:id/mssg",function(req,res){

	Agentlist.find( { cid : req.params.id} ,function(err,agent){
		if(!(agent.length))
		{
			res.send({ connected : false  });
					
		}
		else
		{
			res.send({connected : true , messages : agent[0].chat});
		}
	});
		
});
app.post("/chats/agent/:id",function(req,res){

Agentlist.find({ aid : req.params.id },function(err , query){
		if(err)
			console.log(err);
		else{
			var n=query[0].chat.length;
			query[0].chat[n]={
				sender : "agent",
				message : req.body.message 
			} ;

			Agentlist.updateOne({_id : query[0]._id },query[0],function(err,result){});
		res.redirect("/chats/agent/"+req.params.id);
		}
	});

});

app.post("/chats/client/:id",function(req,res){

	Agentlist.find({ cid : req.params.id},function(err , query){
		if(err)
			console.log(err);
		else
		{
			if(query.length!=0){
				var n=query[0].chat.length;
				query[0].chat[n]={
									sender : "client",
									message : req.body.message 
								  };

				Agentlist.updateOne({_id : query[0]._id },query[0],function(err,result){});
				res.redirect("/chats/client/"+req.params.id );
			}
			else
			{
				Waitinglist.find( { cid : req.params.id},function(err , query2){
				var n=query2[0].chat.length;
				query2[0].chat[n]={
									sender : "client",
									message : req.body.message 
				                  } ;
				Waitinglist.updateOne({_id : query2[0]._id },query2[0],function(err,result){});
				});
				res.redirect("/chats/client/"+req.params.id );
			}
		}
	});
});



app.get("/chats/client/:id/logout",function(req,res){

	Agentlist.find({ aid : req.params.id } ,function(err,some){

		if(some.length)
		{	
			some[0].cid = 0;
			some[0].chat = [];
			Agentlist.updateOne( { cid : req.params.id}, agent[0] ,function(err,some2){}); 
		}
		else
		{
			Waitinglist.deleteOne( { cid : req.params.id},function(err,some2){});	
		}	
	});
	res.redirect("/");

});
app.get("/chats/agent/:id/logout",function(req,res){

 	Agentlist.find({ aid : req.params.id } ,function(err,some){

		if( some.cid==0)
		{	
			Agentlist.deleteOne( { aid : req.params.id},function(err,some2){}); 
		}
		else
		{
			Waitinglist.create( { cid : some.cid , chat : []},function(err,some2){});
			Agentlist.deleteOne( { aid : req.params.id},function(err,some2){}); 	
		}
			
	});
	res.redirect("/login/agent");

	
});

app.listen(port,function(){
	var comments=[];
	function random(n){
		return Number(Math.floor( Math.random() * n ));
	}
	comments.push("Server is ready for some Rock 'N Roll");
	comments.push("Server is Active  and Running.");
	comments.push("Server Hoisted Successfully");
	comments.push("Port "+port+" is ACTIVATED and ENGAGED");
	comments.push("Server says ALPHA is on DUTY");
	comments.push("My name is server and I'm Alive!");
	comments.push("Port "+port+" is ACTIVATED and ENGAGED.");
	console.log(comments[random(comments.length )]);
});


