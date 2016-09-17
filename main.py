from flask import Flask
from flask import render_template, request, redirect, jsonify
from flask_cache import Cache
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import desc
from flask_security import Security, SQLAlchemyUserDatastore, UserMixin, RoleMixin, login_required
import datetime
import warnings
from flask.exthook import ExtDeprecationWarning
warnings.simplefilter('ignore', ExtDeprecationWarning)  #depress warning
from bs4 import BeautifulSoup
from flask_mail import Mail, Message

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

    def __init__(self, id, name):
        self.id = id
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


def adminLog(action, post):
    message = AdminMessage(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), action + '文章(' + post.title + ')')
    db.session.add(message)
    if AdminMessage.query.count() > 500:
        db.session.delete(AdminMessage.query.first())


@app.route('/')
@cache.cached(timeout=None, key_prefix='index', unless=None)
def index():
    posts = Post.query.order_by(desc('time')).all()
    for post in posts:
        post.url = post.time.strftime("/posts/%Y/%m/%d/" + str(post.id))
        post.content = ''.join(BeautifulSoup(post.content, "html.parser").findAll(text=True))
    posts = posts[0:4]
    return render_template('user/index.html', posts=posts)


@app.route('/about')
@cache.cached(timeout=None, key_prefix='about', unless=None)
def about():
    return render_template('user/about.html')


@app.route('/posts/')
@cache.cached(timeout=None, key_prefix='posts', unless=None)
def posts():
    posts = Post.query.order_by(desc('time')).all()
    temp = ''
    for post in posts:
        if temp != post.time.strftime('%Y'):
            post.showYear = True
        else:
            post.showYear = False
        post.url = post.time.strftime("/posts/%Y/%m/%d/" + str(post.id))
        temp = post.time.strftime('%Y')
    return render_template('user/post.html', posts=posts)


@app.route('/contact')
@cache.cached(timeout=None, key_prefix='contact', unless=None)
def contact():
    return render_template('user/contact.html')


@app.route('/posts/<year>/<month>/<day>/<id>')
@cache.memoize(timeout=300, unless=None)
def postDetail(id, year, month, day):
    post = Post.query.filter_by(id=id).first()
    post.time = post.time.strftime("%Y-%m-%d")
    return render_template('user/post-detail.html', post=post)


@app.route('/project')
def skillTree():
    return render_template('user/project.html')


@app.route('/project/skill-tree/showcase')
def skillTreeShowcase():
    return render_template('project/skill-tree/index.html')


@app.route('/admin')
@login_required
def admin():
    messages = AdminMessage.query.order_by(desc('time')).limit(20)
    return render_template('admin/index.html', messages=messages)


@app.route('/admin/custom')
@login_required
def admin_edit():
    return render_template('admin/custom.html')


@app.route('/admin/write-post', methods=["GET", "POST"])
@login_required
def admin_writepost():
    if request.method == 'POST':
        data = request.get_json(force=True)
        post = Post(data['title'], datetime.datetime.now(), data['author'], data['content'])
        tags = [Tag.query.get(x['id']) for x in data['tags']] #很关键
        post.tags = tags
        adminLog('添加', post)
        db.session.add(post)
        db.session.commit()
        cache.delete('posts')
        cache.delete('index')
        return jsonify()
    tags = Tag.query.all()
    return render_template('admin/write-post.html', tags=tags)


@app.route('/admin/post/update/<id>', methods=["GET", "POST"])
@login_required
def admin_updatepost(id):
    if request.method == 'POST':
        post = Post.query.get(id)
        post.title = request.form['title']
        post.content = request.form['content']
        adminLog('修改', post)
        db.session.commit()
        cache.delete('posts')
        cache.delete('index')
        cache.delete('postDetail')
        return render_template('admin/update-post.html', post=post)

    post = Post.query.filter_by(id=id).first()
    return render_template('admin/update-post.html', post=post)


@app.route('/admin/post')
@login_required
def admin_allpost():
    posts = Post.query.order_by(desc('time')).all()
    return render_template('admin/post.html', posts=posts)


@app.route('/admin/post/delete/<id>')
@login_required
def admin_deletepost(id):
    post = Post.query.get(id)
    adminLog('删除', post)
    db.session.delete(post)
    db.session.commit()
    cache.delete('posts')
    cache.delete('index')
    return redirect("/admin/post")


@app.route('/sendMail', methods=['POST'])
def sendMail():
    data = request.get_json(force=True)
    msg = Message(data['name']+'(' + data['email'] + ')给你发了邮件',
                  sender="pc0804@126.com",
                  recipients=["pc0804@126.com"])
    msg.html = '<p>'+data['message']+'</p>'
    mail.send(msg)
    return jsonify(status="OK")

if __name__ == '__main__':
    import logging
    logging.basicConfig(filename='/home/ec2-user/blog-python/error.log', level=logging.DEBUG)
    app.run(host='0.0.0.0', port=80)
#    app.run(debug='true')
