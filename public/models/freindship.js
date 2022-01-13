
class FriendShip {

    constructor(c1, c2){
        this.c1 =c1;
        this.c2 = c2;
    }

    toString(){
        console.log(`${this.c1.username} is friends with ${this.c2.username}`);
    }


}

module.exports = FriendShip;