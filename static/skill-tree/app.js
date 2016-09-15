/**
 * Created by pc on 4/8/16.
 */
var skillTree = angular.module('skillTree', []);
skillTree.controller('mainController', function ($scope, d3) {
    $scope.version = d3.version;

    var width = 1000;
    var height = 700;
    var skillTree = d3.select('body').append('div')
        .attr({
            class: 'skill-tree'
        })
    var svg = skillTree.append('svg')
        .attr('width', width)
        .attr('height', height);
    var def = svg.append('defs');

    function setBackground(imageUrl) {
        svg.append('image')
            .attr('xlink:href', imageUrl)
            .attr({
                x: 0,
                y: 0,
                width: width,
                height: height,
                preserveAspectRatio: 'none'
            });
    }

    function setFlag(data) {
        data.forEach(function (x) {
            x.flag = true;
            x.dependencies.forEach(function (y) {
                y.owner = x.name;
                data.forEach(function (z) {
                    if (z.name === y.name) {
                        if (z.level >= y.level) {
                            y.flag = true;
                            x.flag = x.flag && true;
                        } else {
                            y.flag = false;
                            x.flag = x.flag && false;
                        }
                    }
                })
            });
        });
    }

    function highlightBorder(data) {
        setFlag(data);
        data.forEach(function (x) {
            if (x.flag) {
                svg.select('#' + x.name)
                    .attr('style', 'stroke:#FFF579;stroke-width:2;fill-opacity:0.7');
                if (x.level > 0) {
                    svg.select('#' + x.name)
                        .attr('style', 'stroke:#FFF579;stroke-width:2;fill-opacity:0.1');
                }
            } else {
                svg.select('#' + x.name)
                    .attr('style', 'fill:black;fill-opacity:0.7');
            }
        });
    }

    function highlightLine(data) {
        data.forEach(function (x) {
            x.dependencies.forEach(function (y) {
                if (y.flag) {
                    if (svg.select('#' + y.name + '-' + y.owner + '-path')[0][0] === null) {

                        var length = getLength(generateNodes(data), y.name + '-' + y.owner, 60);
                        svg.append('path')
                            .attr({
                                id: y.name + '-' + y.owner + '-path',
                                d: svg.select('#' + y.name + '-' + y.owner).attr('d') + 'l0,12l-30,0l0,60l60,0l0,-60l-30,0',
                                stroke: 'yellow',
                                'stroke-width': '8px',
                                'stroke-opacity': '0.8',
                                'stroke-dasharray': length + ' ' + length,
                                'stroke-dashoffset': length,
                                fill: 'none'
                            })
                            .transition()
                            .ease('linear')
                            .duration(500)
                            .attr({
                                'stroke-dashoffset': '280'
                            }).remove();
                    }

                    svg.select('#' + y.name + '-' + y.owner)
                        .transition()
                        .delay(300)
                        .attr({style: 'stroke:yellow;stroke-width:8;stroke-opacity:1'});
                }
                if (!y.flag) {
                    svg.select('#' + y.name + '-' + y.owner)
                        .attr({style: 'stroke:yellow;stroke-width:8;stroke-opacity:0.3'})
                }
            })
        })
    }

    function levelup(skill) {
        if (skill.level < skill.maxLevel) {
            skill.level = skill.level + 1;
            svg.select('#' + skill.name + '-level')
                .text(skill.level + '/' + skill.maxLevel);
            d3.select('#skill-info').remove();
            showSkillInfo(skill);

        } else {
            console.log(skill.name + ' already reach the max level!')
            //todo
        }
    }

    function showSkillInfo(skill) {
        var text = skillTree.append('div')
            .attr({
                id: 'skill-info',
                style: 'left:' + (skill.x + 65) + 'px;top:' + skill.y + 'px'
            });
        text.append('p')
            .attr({
                style: 'font-size:25px'
            })
            .text(skill.name);
        text.append('p').text('Level: ' + skill.level + '/' + skill.maxLevel);
        if (skill.dependencies.length > 0) {
            text.append('p').text('Requirement:');
            skill.dependencies.forEach(function (x) {
                text.append('p').text(x.name + ' - level ' + x.level);
            });
        }
        text.append('p').text(skill.description)
    }

    function skill_set(skill, size) {

        def.append('pattern')
            .attr({
                id: skill.name + '-pic',
                patternUnits: "userSpaceOnUse",
                height: height,
                width: width
            }).append('image')
            .attr('xlink:href', skill.imageUrl)
            .attr({
                x: skill.x,
                y: skill.y,
                width: size,
                height: size,
            });

        svg.append('rect')
            .attr({
                x: skill.x,
                y: skill.y,
                rx: 10,
                ry: 10,
                width: size,
                height: size,
                fill: 'url(#' + skill.name + '-pic)',
                style: 'stroke:#9A9A00;stroke-width:4'
            });

        svg.append('rect')
            .attr('id', skill.name)
            .attr('x', skill.x)
            .attr('y', skill.y)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('width', size)
            .attr('height', size)
            .attr('style', 'fill:black;fill-opacity:0.7')
            .on('mouseout', function () {
                /*if (skill.level === 0) {
                 svg.select('#' + skill.name)
                 .attr('style', 'fill:black;fill-opacity:0.7');
                 }*/
                highlightBorder($scope.data);
                svg.select('#' + skill.name + '-text').remove();

                d3.select('#skill-info').remove();
            })
            .on('mouseover', function () {
                showSkillInfo(skill);

                svg.select('#' + skill.name)    //skill border animation
                    .attr('style', 'stroke:#FFF579;stroke-width:2;fill-opacity:0.1');
            })
            .on('click', function () {

                if (skill.flag) {
                    levelup(skill);

                    highlightBorder($scope.data);
                    highlightLine($scope.data);

                    if(skill.level === skill.maxLevel) {
                        svg.select('#' + skill.name + '-level')
                            .attr({
                                style: 'fill:#FEEA2C;text-anchor: middle;font-size: 12px;fill-opacity:0.9'
                            })
                    }else{
                        svg.select('#' + skill.name + '-level')
                            .attr({
                                style: 'fill:white;text-anchor: middle;font-size: 12px;fill-opacity:0.9'
                            })
                    }
                } else {
                    console.log('need skill level');
                    //todo
                }

                $scope.data.forEach(function (x) {
                    x.dependencies.forEach(function (y) {
                        if (y.name === skill.name) {
                            if (x.flag) {
                                iconFlash(x.name);
                            }
                            ;
                        }
                    })
                })

            })
            .on('contextmenu', function () {
                d3.event.preventDefault();

                if (skill.level > 1) {
                    skill.level = skill.level - 1;
                    svg.select('#' + skill.name + '-level')
                        .text(skill.level + '/' + skill.maxLevel);
                    d3.select('#skill-info').remove();
                    showSkillInfo(skill);
                    highlightBorder($scope.data);
                    highlightLine($scope.data);
                    svg.select('#' + skill.name + '-level')
                        .attr({
                            style: 'fill:white;text-anchor: middle;font-size: 12px;fill-opacity:0.9'
                        })
                        .text(skill.level + '/' + skill.maxLevel);
                } else if (skill.level === 1) {
                    skill.level = skill.level - 1;
                    svg.select('#' + skill.name + '-level')
                        .attr({
                            style: 'fill:white;text-anchor: middle;font-size: 12px;fill-opacity:0.5'
                        })
                        .text(skill.level + '/' + skill.maxLevel);
                    d3.select('#skill-info').remove();
                    showSkillInfo(skill);
                    highlightBorder($scope.data);
                    highlightLine($scope.data);
                } else {
                    console.log('reach minimum level');
                    //todo
                    highlightBorder($scope.data);
                    highlightLine($scope.data);
                }
            });

        svg.append('rect')
            .attr({
                x: skill.x + size - 10,
                y: skill.y + size - 12,
                rx: 3,
                ry: 3,
                height: 15,
                width: 20,
                fill: 'black',
                stroke: '#BCB76F'
            });

        if (skill.level === 0) {
            svg.append('text')
                .attr({
                    id: skill.name + '-level',
                    x: skill.x + size,
                    y: skill.y + size,
                    style: 'fill:white;text-anchor: middle;font-size: 12px;fill-opacity:0.5'
                })
                .text(skill.level + '/' + skill.maxLevel);
        } else {
            svg.select('#' + skill.name)
                .attr('style', 'stroke:#FFF579;stroke-width:2;fill-opacity:0.1');
            svg.append('text')
                .attr({
                    id: skill.name + '-level',
                    x: skill.x + size,
                    y: skill.y + size,
                    style: 'fill:white;text-anchor: middle;font-size: 12px;fill-opacity:0.9'
                })
                .text(skill.level + '/' + skill.maxLevel);
        }
    }

    function initial(data, size) {
        data.forEach(function (skill) {
            skill_set(skill, size);
        });
    }

    function generateNodes(data) {
        var nodes = [];
        var point = {};
        data.forEach(function (x) {
            x.dependencies.forEach(function (y) {
                data.forEach(function (z) {
                    if (y.name === z.name) {
                        point.id = y.name + '-' + x.name,
                            point.x2 = x.x;
                        point.y2 = x.y;
                        point.x1 = z.x;
                        point.y1 = z.y;
                        nodes.push(point);
                        point = {};
                    }
                })
            });
        });
        return nodes;
    }

    function drawLine(nodes, size) {
        svg.selectAll('path')
            .data(nodes)
            .enter()
            .append('path')
            .attr({
                id: function (d) {
                    return d.id;
                },
                d: function (d) {
                    if (d.x1 > d.x2) {
                        return 'M' + (d.x1 - 2) + ',' + (d.y1 + size / 2)
                            + 'L' + (d.x2 + size / 2 + 10) + ',' + (d.y1 + size / 2)
                            + 'a10,10 0 0,0 -10,10'
                            + 'L' + (d.x2 + size / 2 ) + ',' + (d.y1 + size / 2 + 10)
                            + 'L' + (d.x2 + size / 2) + ',' + (d.y2 - 12)
                            + 'l-5,0l5,5l5,-5l-5,0';
                    }
                    if (d.x1 < d.x2) {
                        return 'M' + (d.x1 + size + 2) + ',' + (d.y1 + size / 2)
                            + 'L' + (d.x2 + size / 2 - 10) + ',' + (d.y1 + size / 2)
                            + 'a10,10 0 0,1 10,10'
                            + 'L' + (d.x2 + size / 2 ) + ',' + (d.y1 + size / 2 + 10)
                            + 'L' + (d.x2 + size / 2) + ',' + (d.y2 - 12)
                            + 'l-5,0l5,5l5,-5l-5,0';
                    }
                    if (d.x1 = d.x2) {
                        return 'M' + (d.x1 + size / 2) + ',' + (d.y1 + size + 2)
                            + 'L' + (d.x1 + size / 2) + ',' + (d.y2 - 12)
                            + 'l-5,0l5,5l5,-5l-5,0';
                    }
                },
                fill: 'none',
                style: 'stroke:yellow;stroke-width:8;stroke-opacity:0.3'
            });
    }

    function getLength(nodes, id, size) {
        var length;
        nodes.forEach(function (x) {
            if (x.id === id) {
                length = Math.abs(x.x1 - x.x2) + Math.abs(x.y1 - x.y2) + 4 * size;
            }
        });
        return length;
    }

    function iconFlash(skillName) {
        var skill = {};
        $scope.data.forEach(function (x) {
            if (x.name === skillName) {
                skill = x;
            }
        });

        svg.append('image')
            .attr('xlink:href', skill.imageUrl)
            .attr({
                x: skill.x,
                y: skill.y,
                width: 60,
                height: 60,
                opacity: 0,
            })
            .transition()
            .ease('exp')
            .duration(500)
            .attr({
                opacity: 0.7,
            })
            .transition()
            .ease('linear')
            .duration(500)
            .attr({
                x: skill.x - 45,
                y: skill.y - 45,
                width: 150,
                height: 150,
                opacity: 0
            })
            .remove();
    }

    $scope.data = [
        {
            name: 'skill1',
            x: 420,
            y: 40,
            level: 0,
            maxLevel: 2,
            imageUrl: 'http://cdn.dota2.com/apps/dota2/images/abilities/spectre_spectral_dagger_hp1.png?v=3396006',
            dependencies: [],
            description: 'Breathe Fire Unleashes a breath of fire in front of Dragon Knight that burns enemies and reduces the damage their attacks deal.'
        },
        {
            name: 'skill2',
            x: 180,
            y: 140,
            level: 0,
            maxLevel: 2,
            imageUrl: 'http://cdn.dota2.com/apps/dota2/images/abilities/spectre_desolate_hp1.png?v=3396006',
            dependencies: [{name: 'skill1', level: 2}],
            description: 'Breathe Fire Unleashes a breath of fire in front of Dragon Knight that burns enemies and reduces the damage their attacks deal.'
        },
        {
            name: 'skill3',
            x: 660,
            y: 140,
            level: 0,
            maxLevel: 4,
            imageUrl: 'http://cdn.dota2.com/apps/dota2/images/abilities/spectre_dispersion_hp1.png?v=3396006',
            dependencies: [{name: 'skill1', level: 2}],
            description: 'Breathe Fire Unleashes a breath of fire in front of Dragon Knight that burns enemies and reduces the damage their attacks deal.'
        },
        {
            name: 'skill4',
            x: 420,
            y: 240,
            level: 0,
            maxLevel: 1,
            imageUrl: 'http://cdn.dota2.com/apps/dota2/images/abilities/spectre_reality_hp1.png?v=3396006',
            dependencies: [{name: 'skill2', level: 2}, {name: 'skill3', level: 2}],
            description: 'Breathe Fire Unleashes a breath of fire in front of Dragon Knight that burns enemies and reduces the damage their attacks deal.'
        },
        {
            name: 'skill5',
            x: 420,
            y: 340,
            level: 0,
            maxLevel: 1,
            imageUrl: 'http://cdn.dota2.com/apps/dota2/images/abilities/spectre_haunt_hp1.png?v=3396006',
            dependencies: [{name: 'skill4', level: 1}],
            description: 'haha.'
        },
        {
            name: 'skill6',
            x: 520,
            y: 440,
            level: 0,
            maxLevel: 1,
            imageUrl: 'http://cdn.dota2.com/apps/dota2/images/abilities/dragon_knight_elder_dragon_form_hp1.png?v=3379714',
            dependencies: [{name: 'skill5', level: 1}],
            description: 'haha.'
        },
        {
            name: 'skill7',
            x: 520,
            y: 540,
            level: 0,
            maxLevel: 1,
            imageUrl: 'http://cdn.dota2.com/apps/dota2/images/abilities/lycan_shapeshift_hp1.png?v=3379714',
            dependencies: [{name: 'skill6', level: 1}],
            description: 'haha.'
        },
        {
            name: 'skill8',
            x: 180,
            y: 540,
            level: 0,
            maxLevel: 1,
            imageUrl: 'http://cdn.dota2.com/apps/dota2/images/abilities/lycan_shapeshift_hp1.png?v=3379714',
            dependencies: [{name: 'skill2', level: 1}],
            description: 'haha'
        }
    ];

    /*setBackground('http://pre11.deviantart.net/0198/th/pre/f/2013/055/a/6/dragon_knight_illustration_by_eccentricdz-d5w2zqw.jpg');*/

    setBackground('http://www.classywallpapers.com/wp-content/uploads/2015/11/Dota2-Spectre-6.jpg');

    var nodes = generateNodes($scope.data);

    drawLine(nodes, 60);

    initial($scope.data, 60);

    highlightBorder($scope.data);

    highlightLine($scope.data);

});
