from sqlalchemy import desc
from flask import render_template, request, jsonify, redirect
from flask_security import login_required
import datetime


def start(app, cache, Post, AdminMessage, Tag, db):
    def adminLog(action, post):
        message = AdminMessage(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), action + '文章(' + post.title + ')')
        db.session.add(message)
        if AdminMessage.query.count() > 500:
            db.session.delete(AdminMessage.query.first())

    # @app.route('/')
    # @cache.cached(timeout=None, key_prefix='index', unless=None)
    # def index():
    #     posts = Post.query.order_by(desc('time')).all()
    #     for post in posts:
    #         post.url = post.time.strftime("/posts/%Y/%m/%d/" + str(post.id))
    #         post.content = ''.join(BeautifulSoup(post.content, "html.parser").findAll(text=True))
    #     posts = posts[0:4]
    #     return render_template('user/index.html', posts=posts)


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
            post = Post(data['title'], datetime.datetime.now(), data['author'], data['content'], data['imgurl'])
            tags = [Tag.query.get(x['id']) for x in data['tags']]  # 很关键
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
            data = request.get_json(force=True)
            post = Post.query.get(id)
            post.title = data['title']
            post.content = data['content']
            post.imgurl = data['imgurl']
            tags = [Tag.query.get(x['id']) for x in data['tags']]
            post.tags = tags
            adminLog('修改', post)
            db.session.commit()
            cache.delete('posts')
            cache.delete('index')
            cache.delete('postDetail')
            #return render_template('admin/update-post.html', post=post)
            return jsonify()

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

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    @cache.cached(timeout=None, key_prefix='index', unless=None)
    def index1(path):
        return render_template('index.html')
