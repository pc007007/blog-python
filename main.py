from flask import Flask
from flask_cache import Cache
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore, UserMixin, RoleMixin
import warnings
from flask.exthook import ExtDeprecationWarning

warnings.simplefilter('ignore', ExtDeprecationWarning)  # depress warning
from flask_mail import Mail

app = Flask(__name__)

app.config.update(
    MAIL_SERVER='smtp.126.com',
    MAIL_PROT=25,
    MAIL_USE_TLS=True,
    MAIL_USE_SSL=False,
    MAIL_USERNAME="pc0804",
    MAIL_PASSWORD="pc007007",
    MAIL_DEBUG=True
)

mail = Mail(app)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['SECRET_KEY'] = 'super-secret'
#app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost:5432/test2'
app.config['SQLALCHEMY_DATABASE_URI'] = \
    'postgresql://pc007007:pc900804@mydatabase.crdthcvz4g2f.ap-northeast-2.rds.amazonaws.com:5432/blog'
db = SQLAlchemy(app)


roles_users = db.Table('roles_users',
                       db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
                       db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))


class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    confirmed_at = db.Column(db.DateTime())
    roles = db.relationship('Role', secondary=roles_users,
                            backref=db.backref('users', lazy='dynamic'))


tag_post = db.Table('tag_post',
                    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')),
                    db.Column('post_id', db.Integer, db.ForeignKey('post.id'))
                    )


class Post(db.Model):
    __tablename__ = 'post'
    id = db.Column(db.Integer(), primary_key=True)
    title = db.Column(db.String(255), unique=True)
    time = db.Column(db.DateTime)
    author = db.Column(db.String(255))
    content = db.Column(db.Text)
    imgurl = db.Column(db.String(255))
    #tags = db.relationship('Tag', secondary=tag_post, backref=db.backref('posts', lazy='dynamic'))
    tags = db.relationship('Tag', secondary=tag_post, back_populates="posts")

    def __init__(self, title, time, author, content, imgurl):
        self.title = title
        self.time = time
        self.author = author
        self.content = content
        self.imgurl = imgurl

    def as_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'time': self.time,
            'author': self.author,
            'content': self.content,
            'imgurl': self.imgurl,
            'tags': [t.as_dict() for t in self.tags]
        }

    #def as_dict(self):
    #   return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Tag(db.Model):
    __tablename__ = 'tag'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True)
    posts = db.relationship('Post', secondary=tag_post, back_populates="tags")

    def __init__(self, id, name):
        self.id = id
        self.name = name

    def as_dict(self):
        return {
            'id': self.id,
            'name': self.name,
        #    'posts': [p.as_dict() for p in self.posts]
        }


class AdminMessage(db.Model):
    __tablename__ = 'AdminMessage'
    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.DateTime)
    content = db.Column(db.String(255))

    def __init__(self, time, content):
        self.time = time
        self.content = content


user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

db.create_all()

import router
router.start(app, cache, Post, AdminMessage, Tag, db)

import api
api.start(app, mail, db, Tag, Post)

if __name__ == '__main__':
    import logging

    logging.basicConfig(filename='/home/ec2-user/var/org/chengpeng/error.log', level=logging.DEBUG)
    app.run(host='0.0.0.0', port=80)
    #app.run(debug='true')
