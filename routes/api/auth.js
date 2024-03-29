const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {check, validationResult } = require ('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');

//@route Get Api/auth
//@desc Test route
//@access Public
router.get('/', auth, async (req,res) => {
 try {
     const user = await User.findById(req.user.id).select('-password');
     res.json(user);
 } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error')  
 }
});

//@route Post Api/auth
//@desc authenticate user and get the token
//@access Public
router.post('/', [
    check('email', 'please include a valid email').isEmail(),
    check( 
        'password','password is required'
    ).exists()
],
    async (req,res) => { 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
  
        if (!user) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }
     
    // compare the email with user input 
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }
      
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

module.exports = router ;