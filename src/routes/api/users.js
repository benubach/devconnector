const express = require('express');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcryptjs = require('bcryptjs');
const router = express.Router();
const jsonwebtoken = require('jsonwebtoken');
const {jwtSecret} = require('../../config');

router.get('/', (req, res) => {
    res.json({message: 'Users Work'});
});

// @route   POST api/users/register
// @desc    Register User
// @access  Public
router.post('/register', (req, res) => {
    User.findOne({email: req.body.email})
        .then(user => {
            if(user){
                return res.status(400).json({email: 'Email already exists'});
            } else {
                const avatar = gravatar.url(req.body.email,
                    {
                        s: '200',
                        r: 'pg',
                        d: 'mm'
                    });
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    avatar,
                    password: req.body.password
                });

                bcryptjs.genSalt(10, (err, salt) => {
                    bcryptjs.hash(newUser.password, salt, (err, hash) => {
                        if(err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then((user) => {
                                res.status(201).json(user);
                            })
                            .catch(err => console.error(err));
                    });
                });
            }
        });
});

router.post('/login', (req, res) => {
    const {email, password} = req.body;

    //Find user by email
    User.findOne({email})
        .then((user) => {
            if(!user){
                return res.status(404).json({email: 'User not found'});
            }
            bcryptjs.compare(password, user.password)
                .then((isMatch) => {
                    if(isMatch){
                        const payload = {
                            id: user._id,
                            name: user.name,
                            avatar: user.avatar
                        };
                        //Sign Token
                        return jsonwebtoken.sign(payload, jwtSecret, {expiresIn: '1h'}, (err, token) => {
                            if(err)
                                return res.status(500).json({message: 'Internal server error'});
                            return res.status(200).json({
                                success: true,
                                token: `Bearer ${token}`
                            });
                        });
                    }
                    return res.status(400).json({password: 'Password incorrect'});

                });
        });
});
module.exports = router;
