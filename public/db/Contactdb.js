const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


const Schema = mongoose.Schema;


let contactSchema = new Schema({

    _id : Schema.Types.ObjectId,
    email : String,
    username : String,
    password : String

});

contactSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

contactSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}


module.exports = mongoose.model('ContactSchema', contactSchema);