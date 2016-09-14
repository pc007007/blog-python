#!/usr/bin/python
# -*- coding: utf-8 -*-
from flask import Flask
from flask import render_template, request, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore, UserMixin, RoleMixin, login_required
import datetime

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'super-secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost:5432/test2'
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
    tags = db.relationship('Tag', secondary=tag_post, backref=db.backref('posts', lazy='dynamic'))

    def __init__(self, title, time, author, content):
        self.title = title
        self.time = time
        self.author = author
        self.content = content


class Tag(db.Model):
    __tablename__ = 'tag'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True)

    def __init__(self, name):
        self.name = name


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


def adminLog(action,post):
    message = AdminMessage(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), action + '文章(' + post.title + ')')
    db.session.add(message)


@app.route('/')
def index():
    return render_template('user/index.html')


@app.route('/about')
def about():
    return render_template('user/about.html')


@app.route('/posts')
def posts():
    posts = Post.query.order_by("time desc").all()
    for post in posts:
        post.url = post.time.strftime("/posts/%Y/%m/%d/" + str(post.id))
    return render_template('user/post.html', posts=posts)


@app.route('/contact')
def contact():
    return render_template('user/contact.html')


@app.route('/posts/<year>/<month>/<day>/<id>')
def postDetail(id, year, month, day):
    post = Post.query.filter_by(id=id).first()
    post.time = post.time.strftime("%Y-%m-%d")
    return render_template('user/post-detail.html', post=post)


@app.route('/admin')
@login_required
def admin():
    messages = AdminMessage.query.order_by("time desc").limit(20)
    return render_template('admin/index.html', messages=messages)


@app.route('/admin/custom')
@login_required
def admin_edit():
    return render_template('admin/custom.html')


@app.route('/admin/write-post', methods=["GET", "POST"])
@login_required
def admin_writepost():
    if request.method == 'POST':
        post = Post(request.form['title'], datetime.datetime.now(), request.form['author'], request.form['content'])
        adminLog('添加', post)
        db.session.add(post)
        db.session.commit()
        return redirect('/admin')
    return render_template('admin/write-post.html')


@app.route('/admin/post/update/<id>', methods=["GET", "POST"])
@login_required
def admin_updatepost(id):
    if request.method == 'POST':
        post = Post.query.get(id)
        post.title = request.form['title']
        post.content = request.form['content']
        adminLog('修改', post)
        db.session.commit()
        return render_template('admin/update-post.html', post=post)

    post = Post.query.filter_by(id=id).first()
    return render_template('admin/update-post.html', post=post)


@app.route('/admin/post')
@login_required
def admin_allpost():
    posts = Post.query.order_by("time desc").all()
    return render_template('admin/post.html', posts=posts)


@app.route('/admin/post/delete/<id>')
@login_required
def admin_deletepost(id):
    post = Post.query.get(id)
    adminLog('删除', post)
    db.session.delete(post)
    db.session.commit()
    return redirect("/admin/post")

if __name__ == '__main__':
    app.run()
