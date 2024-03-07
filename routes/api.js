"use strict";

const BoardModel = require("../models").Board;
const ThreadModel = require("../models").Thread;
const ReplyModel = require("../models").Reply;

module.exports = function (app) {
  app
    .route("/api/threads/:board")
    .post((req, res) => {
      const { text, delete_password } = req.body;
      const board = req.params.board;
      console.log("post", req.body, board);
      const newThread = new ThreadModel({
        text: text,
        delete_password: delete_password,
        replies: [],
      });
      console.log("newThread:", newThread);
      BoardModel.findOne({ name: board }, (err, Boarddata) => {
        if (!Boarddata) {
          const newBoard = new BoardModel({
            name: board,
            threads: [],
          });
          console.log("newBoard", newBoard);
          newBoard.threads.push(newThread);
          newBoard.save((err, data) => {
            console.log("newBoardData", data);
            if (err || !data) {
              console.log(err);
              res.send("There was an error saving in post");
            } else {
              res.json(newThread);
            }
          });
        } else {
          Boarddata.threads.push(newThread);
          Boarddata.save((err, data) => {
            if (err || !data) {
              res.send("There was an error in saving in post");
            } else {
              res.json(newThread);
            }
          });
        }
      });
    })
    .get((req, res) => {
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, data) => {
        if (!data) {
          console.log("No board with this name");
          res.json({ error: "No board with this name" });
        } else {
          console.log("data", data);
          const threads = data.threads.filter((a)=>a.bumped_on != a.created_on).sort((a,b)=> b.created_on.getTime()-a.created_on.getTime()).slice(0,10).map((thread) => {
            const {
              _id,
              text,
              created_on,
              bumped_on,
              reported,
              delete_password,
            } = thread;
            // let replies=thread.replies.sort((a,b)=> Date.parse(b.created_on)-Date.parse(a.created_on)).slice(0,3);
            let replies=thread.replies.sort((a,b)=> b.created_on.getTime()-a.created_on.getTime()).slice(0,3).map((reply) => {
              const {
                _id,
                text,
                created_on,
                bumped_on,
                reported,
                delete_password,
              } = reply;
              // let replies=thread.replies.sort((a,b)=> Date.parse(b.created_on)-Date.parse(a.created_on)).slice(0,3);
              return {
                _id,
                text,
                created_on,
                // bumped_on,
                // reported,
                // delete_password,
              };
            });;
            return {
              _id,
              text,
              created_on,
              bumped_on,
              // reported,
              // delete_password,
              replies,
              replycount: thread.replies.length,
            };
          });
          res.json(threads);
        }
      });
      console.log("post", req.body);
    })

    .put((req, res) => {
      console.log("put", req.body);
      const { thread_id } = req.body;
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (!boardData) {
          res.json("error", "Board not found");
        } else {
          const date = new Date();
          let reportedThread = boardData.threads.id(thread_id);
          reportedThread.reported = true;
          reportedThread.bumped_on = date;
          boardData.save((err, updatedData) => {
            res.send("reported");
          });
        }
      });
    })

    .delete((req, res) => {
      console.log("delete", req.body);
      const { thread_id, delete_password } = req.body;
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (!boardData) {
          res.json("error", "Board not found");
        } else {
          let threadToDelete = boardData.threads.id(thread_id);
          if (threadToDelete.delete_password == delete_password) {
            threadToDelete.remove();
          } else {
            res.send("incorrect password");
            return;
          }
          boardData.save((err, updatedData) => {
            res.send("success");
          });
        }
      });
    });

  app.route("/api/replies/:board").post((req, res) => {
    console.log("thread", req.body);
    const { thread_id, text, delete_password } = req.body;
    const board = req.params.board;
   const newReply=new ReplyModel({
    text:text,
    delete_password:delete_password,
   });
   BoardModel.findOne({name:board}, (err,boardData)=>{
    if(!boardData){
      res.json("error", "Board not found");
    }else{
      const date=new Date();
      let threadToAddReply=boardData.threads.id(thread_id);
      console.log(JSON.stringify(threadToAddReply))
      threadToAddReply.bumped_on=date;
      threadToAddReply.replies.push(newReply);
      boardData.save((err, updatedData)=>{
        res.json(updatedData);
      });
    }
   });
  })
  .get((req, res)=>{
    const board=req.params.board;
    BoardModel.findOne({name: board},(err, data)=>{
      if(!data){
        console.log("No board with this name");
        res.json({error:"No board with this name"});
      }else{
        console.log("data", data);
        const thread=data.threads.id(req.query.thread_id);
        let thread1={_id:thread._id,
          text:thread.text,
          created_on:thread.created_on,
          bumped_on:thread.bumped_on,
          replies:thread.replies
        }

        thread1.replies = thread.replies.map((reply) => {
          const {
            _id,
            text,
            created_on,
            bumped_on,
            reported,
            delete_password,
          } = reply;
          // let replies=thread.replies.sort((a,b)=> Date.parse(b.created_on)-Date.parse(a.created_on)).slice(0,3);
          return {
            _id,
            text,
            created_on,
            bumped_on,
            // reported,
            // delete_password,
          };
        });
        thread

        res.json(thread1);
      }
    });
  })
  .put((req, res)=>{
    const { thread_id, reply_id}=req.body;
    const board=req.params.board;
    BoardModel.findOne({name:board}, (err,data)=>{
      if(!data){
        console.log("No board with this name");
        res.json({error:"No board with this name"});
      }else{
        console.log("data", data);
        let thread=data.threads.id(thread_id);
        let reply=thread.replies.id(reply_id);
        reply.reported=true;
        reply.bumped_on=new Date();
        data.save((err,updatedData)=>{
          if(!err){
            res.send("reported");
          }
        });
      }
    });
  })
  .delete((req,res)=>{
    const{ thread_id, reply_id, delete_password}=req.body;
    console.log("delete reply body", req.body);
    const board= req.params.board;
    BoardModel.findOne({name:board}, (err,data)=>{
      if(!data){
        console.log("No board with this name");
        res.json({error: "No board with this name"});
      }else{
        console.log("data",data);
        let thread=data.threads.id(thread_id);
        let reply=thread.replies.id(reply_id);
        if(reply.delete_password=== delete_password){
          reply.text="[deleted]";
        }else{
          res.send("incorrect password");
          return
        }
        data.save((err, updatedData)=>{
          if(!err){
            res.send("success");
          }
        });
      }
    });
  });

  
};
