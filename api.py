from flask_security import login_required
from flask import request, jsonify, render_template
from flask_mail import Message
from sqlalchemy import desc
from bs4 import BeautifulSoup

def start(app, mail, db, Tag, Post):
    @app.route('/sendMail', methods=['POST'])
    def sendMail():
        data = request.get_json(force=True)
        msg = Message(data['name'] + '(' + data['email'] + ')给你发了邮件',
                      sender="pc0804@126.com",
                      recipients=["pc0804@126.com"])
        msg.html = '<p>' + data['message'] + '</p>'
        mail.send(msg)
        return jsonify(status="OK")

    @app.route('/api/tag')
    def getTag():
        tags = Tag.query.all()
        tagsJson = []
        for tag in tags:
            tagsJson.append(tag.as_dict())
        return jsonify(tagsJson)

    @app.route('/api/tag', methods=["POST"])
    @login_required
    def addTag():
        data = request.get_json(force=True)
        tag = Tag(data['tag']['id'], data['tag']['name'])
        db.session.add(tag)
        db.session.commit()
        return jsonify({'id': tag.id, 'name': tag.name})

    @app.route('/api/post', methods=["GET"])
    def getPost():
        limit = request.args.get('limit')
        posts = Post.query.order_by(desc('time')).limit(limit)

        postsJson = []
        for post in posts:
            postsJson.append(post.as_dict())
        return jsonify(postsJson)

    @app.route('/api/post/<id>', methods=["GET"])
    def getPostById(id):
        post = Post.query.get(id)
        if post is None:
            return jsonify({'error':'No such post'})
        return jsonify(post.as_dict())

    @app.route('/api/aboutContent', methods=["GET"])
    def getAboutContent():
        return render_template('beta/aboutContent.html')

    @app.route('/api/indexContent', methods=["GET"])
    def getIndexContent():
        posts = Post.query.order_by(desc('time')).limit(5)
        for post in posts:
            post.url = post.time.strftime("/posts/%Y/%m/%d/" + str(post.id))
            post.content = ''.join(BeautifulSoup(post.content, "html.parser").findAll(text=True))
        return render_template('beta/indexContent.html', posts=posts)

    @app.route('/api/postsContent', methods=["GET"])
    def getPostsContent():
        posts = []
        if request.args.get('tag') is None:
            posts = Post.query.order_by(desc('time')).all()
            temp = ''
            for post in posts:
                if temp != post.time.strftime('%Y'):
                    post.showYear = True
                else:
                    post.showYear = False
                post.url = post.time.strftime("/posts/%Y/%m/%d/" + str(post.id))
                temp = post.time.strftime('%Y')
            message = "所有文章"
            return render_template('beta/postsContent.html', posts=posts, message=message)
        else:
            tag = Tag.query.get(request.args.get('tag'))
            posts = tag.posts
            message = tag.name
            for post in posts:
                post.url = post.time.strftime("/posts/%Y/%m/%d/" + str(post.id))
            return render_template('beta/postsContent.html', posts=posts, message=message)

    @app.route('/api/postsHeader', methods=["GET"])
    def getPostsHeader():
        return render_template('beta/postsHeader.html')

    @app.route('/api/projectHeader', methods=["GET"])
    def getProjectHeader():
        return render_template('beta/projectHeader.html')

    @app.route('/api/projectContent', methods=["GET"])
    def getProjectContent():
        return render_template('beta/projectContent.html')

    @app.route('/api/postSidebar/<id>', methods=["GET"])
    def getPostSidebar(id):
        recentPosts = Post.query.order_by(desc('time')).limit(5)
        tags = Tag.query.all()
        for t in tags:
            t.count = t.posts.__len__()
        post = Post.query.get(id)
        tagsX = post.tags
        relPosts = []
        for t in tagsX:
            relPosts.extend(t.posts)
        relPosts = list(set(relPosts))
        if relPosts.__len__() > 0:
            relPosts.remove(post)
        return render_template('beta/postDetailSidebar.html', recentPosts=recentPosts, tags=tags, relPosts=relPosts[0:5])