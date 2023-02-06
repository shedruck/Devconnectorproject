const express = require('express')
const router = express.Router();
const {check, validationResult } = require ('express-validator');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar')
const jwt = require('jsonwebtoken')
const User = require('../../models/User');
const config = require('config');
//const bcrypt = require('bcryptjs/dist/bcrypt');

//@route Post Api/users
//@desc Register user
//@access Public
router.post('/', [
    check('name', 'Name is required')
    .not()
    .isEmpty(),
    check('email', 'please include a valid email').isEmail(),
    check( 
        'password',
        'please enter a password with 6 or more characters'
    ).isLength({min:6})
],
    async (req,res) => { 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array() });
    }

    const {name, email, password } = req.body;

    try {
    // see if the exits
    let user = await User.findOne({email});
    if(user) {
        return 
        res.status(400)
        .json({errors: [{msg: 'User already exits'}]});
    }
 
    // Get users gravatar
      const avatar = gravatar.url(email, {
          s:'200',
          r:'pg',
          d:'mm'
      })
      // create new instance of user
      user = new User({
          name,
          email,
          avatar,
          password
      })
    // encrtpt password
       const salt = await bcrypt.genSalt(10);

       user.password = await bcrypt.hash(password, salt);

       await user.save();

    // return json webtoken
    const payload = {
        user: {
            id:user.id
        }
    }

    jwt.sign(payload, 
         config.get('jwtToken'),
         {expiresIn:36000},
         (err, token) => {
             if(err) throw err;
             res.json({token});
         });

    
    } catch (err) {
       console.error(err.message);
       res.status(500).send('Server error');
    }
    
});

module.exports = router;