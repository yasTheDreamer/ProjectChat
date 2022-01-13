const mongoose = require('mongoose')

let Schema = mongoose.Schema;



let FriendShipSchema = new Schema({

    firstContact :{type : Schema.Types.ObjectId, ref: 'Contact'} ,
    secondContact : {type : Schema.Types.ObjectId, ref: 'Contact'}

})


module.exports = mongoose.model('FriendShipShcema', FriendShipSchema);