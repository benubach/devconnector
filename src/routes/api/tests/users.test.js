const expect = require('chai').expect;
const sinon = require('sinon');

const http_mocks = require('node-mocks-http');
const mockery = require('mockery');
const gravatar = require('gravatar');
const bcryptjs = require('bcryptjs');

const buildResponse = () => http_mocks.createResponse({eventEmitter: require('events').EventEmitter});

describe('api/users.js', () => {
    describe('User Registration', () => {
        let findOneStub = sinon.stub();
        let createStub = sinon.stub();
        let gravatarMock;
        let users;

        before(() => {
            mockery.enable();
            mockery.registerMock('../../models/User', {
                findOne: findOneStub,
                create: createStub
            });
            users = require('../users');
        });

        beforeEach(() => {
            gravatarMock = sinon.mock(gravatar);
            sinon.stub(bcryptjs, 'genSalt');
            sinon.stub(bcryptjs, 'hash');
        });

        afterEach(() => {
            findOneStub.reset();
            createStub.reset();
            bcryptjs.genSalt.restore();
            bcryptjs.hash.restore();
        });

        it('should reject an already existing email', (done) => {
            findOneStub.resolves({email: 'someone@somewhere.com'});
            let request = http_mocks.createRequest({
                method: 'POST',
                url: '/register'
            });
            gravatarMock.expects('url').never();
            let response = buildResponse();
            response.on('end', () => {
                gravatarMock.verify();
                expect(response.statusCode).to.equal(400);
                expect(response._isJSON()).to.equal(true);

                let data = JSON.parse(response._getData());
                expect(data).to.have.own.property('email', 'Email already exists');

                done();
            });
            users.handle(request, response);
        });

        it('should create a new user when email is available', (done) => {
            findOneStub.resolves(null);
            let newUser = {
                email: 'someone@somewhere.com',
                password: 'mypassword',
                name: 'someone'
            };
            let request = http_mocks.createRequest({
                method: 'POST',
                url: '/register',
                body: newUser
            });
            gravatarMock.expects('url').once().withArgs(newUser.email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            }).returns('gravatarUrl');

            bcryptjs.genSalt.yields(null, 'salt');
            bcryptjs.hash.yields(null, 'hashedPassword');
            createStub.resolves(newUser);
            let response = buildResponse();
            response.on('end', () => {
                gravatarMock.verify();
                expect(response.statusCode).to.equal(201);
                expect(response._isJSON()).to.equal(true);

                let data = JSON.parse(response._getData());
                Object.keys(newUser).forEach((key) => {
                    expect(data).to.have.own.property(key, newUser[key]);
                });

                expect(createStub.callCount).to.equal(1);
                console.log(createStub.lastCall.args);
                expect(createStub.firstCall.args[0]).to.deep.equal({...newUser, password: 'hashedPassword', avatar: 'gravatarUrl'});

                done();
            });
            users.handle(request, response);
        });
    });
});
