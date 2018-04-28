const express = require('express');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcryptjs = require('bcryptjs');
const router = express.Router();


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
module.exports = router;
