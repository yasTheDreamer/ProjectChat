class Contact {


    constructor(id, email, username, password ){

        this.id = id;
        this.email = email;
        this.username = username;
        this.password = password;

    }

    toString() {
        console.log(`id : ${this.id}`)
        console.log("email : "+ this.email)
        console.log("username : " + this.username)
        console.log("password : "  + this.password)
    }


}


module.exports = Contact;