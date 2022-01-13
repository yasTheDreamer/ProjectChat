const mongoose = require('mongoose');
const { model } = require('./Contactdb');

const Shcema = mongoose.Schema;

const messageShcema = new Shcema({

    message : String,
    sender : {type : Shcema.Types.ObjectId, ref : 'ContactSchema'},
    reciever : {type : Shcema.Types.ObjectId , ref : 'ContactSchema'}


})

module.exports = mongoose.model('MessageShcema', messageShcema);