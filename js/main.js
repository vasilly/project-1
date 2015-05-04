(function() {
    "use strict"
    var canvas1 = document.getElementById("canvas1");
    canvas1.width = innerWidth - 1;
    canvas1.height = innerHeight - 1;
    var
        help_dialog = false,
        PI2 = 2 * Math.PI,
        angleX = 50,
        msg3 = document.getElementById("msg3"),
        ctx = canvas1.getContext("2d"),
        PI = Math.PI,
        cos = Math.cos,
        sin = Math.sin,
        max = Math.max,
        min = Math.min,
        round = Math.round,
        floor = Math.floor,
        start = 0,
        focus = 200,
        w2 = canvas1.width / 2,
        h2 = canvas1.height / 2,
        w5 = canvas1.width / 5,
        h5 = canvas1.height / 5,
        w2_5 = canvas1.width * 2 / 5,
        w3_5 = canvas1.width * 3 / 5,
        h2_5 = canvas1.height * 2 / 5,
        h3_5 = canvas1.height * 3 / 5,
        rotateSpeed = 1 / 20000,
        maxX = 0,
        p = [],
        mX = 0,
        mY = 0,
        loop = 0,
        delay = 1000 / 60,
        time = 0,
        max_z = 0, //max height of all
        min_z = 0, //min height of all
        zoom = 4.8,
        stopXY, outerX, outerY, g1, g2, mmY, mmX,
        totalRotation = getRotationMatrix(-PI / 4, mY); //initialise rot. matrix
    //end_variables
    document.getElementById("buttonUp").onclick = function() {
        movePlane("up", 10)
    }
    document.getElementById("buttonDown").onclick = function() {
        movePlane("up", -10)
    }
    document.getElementById("buttonLeft").onclick = function() {
        movePlane("right", -10)
    }
    document.getElementById("buttonRight").onclick = function() {
        movePlane("right", 10)
    }
    document.getElementById("buttonZoomIn").onclick = function() {
        zoom *= 1.1;
        draw();
        offTimer()
    }
    document.getElementById("buttonZoomOut").onclick = function() {
        zoom /= 1.1;
        draw();
        offTimer()
    }
    document.getElementById("buttonHome").onclick = function() {
            centre_planes();
            draw();
            offTimer()
        }
        // disable scroll Stack overflow: http://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily
        // scrolling the mousewheel will activate the canvas zoom function below, instead of default browser page zoom
    function disable_scroll() {
        if (window.addEventListener) {
            window.addEventListener('DOMMouseScroll', preventDefault, false);
        }
        window.onmousewheel = document.onmousewheel = preventDefault;
    }

    function preventDefault(e) {
        e = e || window.event;
        if (e.preventDefault)
            e.preventDefault();
        e.returnValue = false;
    }
    disable_scroll()

    function toggleTimer() {
            if (loop === 0) {
                loop = setInterval(draw, delay);
            }
        } // make sure timer is on
    function offTimer() {
            clearInterval(loop);
            loop = 0
        } // make sure timer is off
    canvas1.onmousemove = function(a) {
        mX = a.clientX;
        mY = a.clientY
        outerX = (mX < w2_5) || (mX > w3_5)
        outerY = (mY < h2_5) || (mY > h3_5)
        mmY = (outerX) ? h2 : mY;
        mmX = (outerY) ? w2 : mX;
        stopXY = ((!outerX) && (!outerY))
        if (!stopXY && outerX && outerY || stopXY) {
            drawMseBox(outerX, outerY, stopXY)
            offTimer()
            draw()
        } else {
            toggleTimer()
        }
    }
    canvas1.onclick = function(d) {
        if ((stopXY)) centre_planes() //mouse is in centre square
        else {
            if (loop) { //drawLines()
                clearInterval(loop);
                loop = 0;
                ("freeze")
            } else {
                loop = setInterval(draw, delay);
            }
        }
    }
    canvas1.onmousewheel = function(e) { // chrome only
        if (e.wheelDelta > 0) {
            zoom *= 1.06;
        } else if (e.wheelDelta < 0) {
            zoom /= 1.06;
        }
        draw()
    }

    function fn1(x, y) {
        var mag = Math.sqrt(x * x + y * y) || 1;
        return 40 * sin(mag) / mag
    }

    function fn1a(x, y) {
        var xShift = [12, 13, -11, 15, 13],
            yShift = [10, -14, -12, -16, 2],
            coeff = [110, 80, 80, 60, 80],
            sum = 0,
            i = xShift.length,
            x1, y1, mag
        while (i--) {
            x1 = x + xShift[i];
            y1 = y + yShift[i];
            mag = Math.sqrt(x1 * x1 + y1 * y1);
            sum = sum + coeff[i] * sin(mag) / mag
        }
        return sum
    }

    function makeGrid(fn) {
        var p = [],
            count = 0,
            point,
            old_point = {
                z: 0
            },
            grd = 8,
            step = .5,
            r, g, b, sun, rgb, height_color,
            height,
            seaLevel = 0, // higher is deeper
            snowLevel = -15; //lower is higher
        g2 = Math.floor(grd / step * 2) + 1; // number of points in row
        g1 = g2 - 1; //length of drawn line in squares
        for (var x = -grd; x <= grd; x += step)
            for (var y = -grd; y <= grd; y += step) {
                var z = fn(x, y);
                if (z) max_z = round(max(z, max_z));
                if (z) min_z = round(min(z, min_z));
                height = (z > seaLevel) ? 0 : z;
                //add shadow:
                sun = (height - old_point.z) * 10 / step;
                rgb = colorize(z, seaLevel, snowLevel, sun);
                r = rgb[0];
                g = rgb[1];
                b = rgb[2];
                height_color = "rgb(" + r + "," + g + "," + b + ")";
                point = {
                    color: height_color,
                    x: x * 10,
                    y: y * 10,
                    z: height,
                    x0: x * 10,
                    y0: y * 10,
                    z0: height,
                    r: r,
                    g: g,
                    b: b,
                    sun: sun,
                    count: count++
                }
                p.push(point);
                old_point = point;
            }
        document.getElementById("msgtop2").innerHTML = p.length
        return p
    }

    function colorize(z, seaLevel, snowLevel, sun) {
        var r, g, b;
        r = -z + 10;
        g = -z + 30;
        b = -z + 10; // green hills
        if (z < snowLevel) {
            r = 180 - z * 2;
            g = 180 - z * 2;
            b = 180 - z * 2;
        } //tallest==white
        if (z > seaLevel) {
            r = 255 - z * 3;
            g = 255 - z * 2;
            b = 255 - z / 2 + 100;
        } //ocean=blue
        r = r + sun;
        g = g + sun;
        b = b + sun;
        r = (r > 255) ? 255 : r;
        g = (g > 255) ? 255 : g;
        b = (b > 255) ? 255 : b;
        r = (r < 0) ? 0 : r;
        g = (g < 0) ? 0 : g;
        b = (b < 0) ? 0 : b;
        r = round(r);
        g = round(g);
        b = round(b);
        return [r, g, b]
    }

    function vertice_txt(p, b) {
        var oldfont = ctx.font;
        ctx.font = 'italic 20px Calibri'; //ctx.font = "30pt Arial";
        ctx.fillStyle = "red";
        var txt = 'n,x,y: ' + b + ' (' + p[b].x0 + ' ' + p[b].y0 + ')' //
        var txt = '(' + p[b].x0 + ' , ' + p[b].y0 + ')' //
        var txt = (p[b].z0) ? Math.round(p[b].z0) : 'No'
        var txt = 'x: ' + p[b].x //
            //var txt= '_y: '+ Math.round(p[b].sun)  //
        ctx.fillText(txt, p[b]._x, p[b]._y) //vertice coord.
        ctx.font = oldfont
    }

    function drawMseBox(outerX, outerY, stopXY) {
            var old_linewidth = ctx.lineWidth;
            var large = 36,
                small = 0.5
            ctx.lineWidth = (old_linewidth < small) ? small : (old_linewidth > large) ? large : old_linewidth
            var original_color = ctx.strokeStyle;
            ctx.strokeStyle = 'grey';
            ctx.fillstyle = 'white';
            msg3.innerHTML = ''
            ctx.font = '80px Calibri'; //    ctx.font = "60px sans-serif";
            if ((stopXY)) { //centre square
                ctx.strokeRect(w2_5, h2_5, w5, h5)
                msg3.innerHTML = '<i class="fa fa-stop"></i>'
            } else if ((!outerX) || (!outerY)) {
                if (!outerX) {
                    ctx.strokeRect(w2_5, 0, w5, canvas1.height);
                    msg3.innerHTML = '<i class="fa fa-arrows-v"></i>'
                }
                if (!outerY) {
                    ctx.strokeRect(0, h2_5, canvas1.width, h5);
                    msg3.innerHTML = '<i class="fa fa-arrows-h"></i>'
                }
            } else { //outer 4 quadrants
                msg3.innerHTML = '<i class="fa fa-stop"></i>'
            }
            ctx.lineWidth = old_linewidth //ctx.strokeStyle=original_color;
        } //drawMseBox
    function initialise_draw() {
        //globals:
        start = +new Date();
        outerX = (mX < w2_5) || (mX > w3_5)
        outerY = (mY < h2_5) || (mY > h3_5)
        mmY = (outerX) ? h2 : mY;
        mmX = (outerY) ? w2 : mX;
        stopXY = ((!outerX) && (!outerY))
            //end globals:
        if ((stopXY)) {
            mmX = w2;
            mmY = h2
        }
        ctx.clearRect(0, 0, canvas1.width, canvas1.height);
    }

    function rotatePoints(p, totalRotation) {
            var h = (mmX - w2) * rotateSpeed,
                j = cos(h),
                l = sin(h),
                g = (mmY - h2) * rotateSpeed,
                i = cos(g),
                k = sin(g),
                x = 0,
                y = 1,
                z = 2,
                point, e, d, a1,
                new_rotation,
                totalRotation;
            new_rotation = getRotationMatrix(g, h);
            totalRotation = m3_x_m3(new_rotation, totalRotation);
            for (var i = p.length; i--;) {
                point = p[i]; //a is the point
                a1 = m3_x_v3(totalRotation, [point.x, point.y, point.z]);
                e = zoom * focus / (focus + a1[z]); // f/(f+z)=1/(1+z/f)
                point._x = w2 + a1[x] * e;
                point._y = h2 + a1[y] * e;
            }
            return totalRotation
        }
        []

    function paintSquare(pt, i, middle) {
        /*
        white 255,255,255
        black   0,  0,  0
            r,  g,  b
        */
        var p1 = pt[i],
            p2 = pt[i + 1],
            p3 = pt[i + 1 + g2],
            p4 = pt[i + g2],
            d = 0,
            ii = i + 1;
        if ((ii % g2)) { //if not the end of the line...draw a square t.
            ctx.fillStyle = p1.color;
            if (middle) ctx.fillStyle = 'green'
            try {
                ctx.beginPath();
                ctx.moveTo(p1._x, p1._y);
                ctx.lineTo(p2._x + d, p2._y);
                ctx.lineTo(p3._x + d, p3._y);
                ctx.lineTo(p4._x, p4._y);
                ctx.lineTo(p1._x, p1._y);
                ctx.fill();
                //  L-shape outline
                ctx.strokeStyle = "grey";
                ctx.beginPath();
                ctx.moveTo(p1._x, p1._y);
                ctx.lineTo(p2._x, p2._y);
                ctx.lineTo(p3._x, p3._y);
                ctx.stroke()
            } catch (q) {}
        }
    }

    function getRotationMatrix(a, b) { // return the rotation matrix from X,Y angles
            var angleX, angleY,
                A = cos(a),
                B = sin(a),
                C = cos(b),
                D = sin(b);
            if (B > 0) { //sinX is positive
                if (A > 0) { //cosX is positive
                }
            }
            /*
                     |  CE      -CF      -D  |
                M  = | -BDE+AF  -BDF+AE  -BC |
                     |  ADE+BF  -ADF+BE   AC |

                A       = cos(angle_x);
                B       = sin(angle_x);

                C       = cos(angle_y);
                D       = sin(angle_y);

                E       = cos(angle_z); = 1 ... no rotation in z for this game
                F       = sin(angle_z); = 0

                     |  C    0  -D  |
                M  = | -BD   A  -BC |
                     |  AD   B   AC |

                     |   Cx  +0y   -Dz |
                MV = | -BDx  +Ay  -BCz |
                     |  ADx  +By   ACz |

                        |x2|  |  cosY.x           - sinY.z      |
            V2 = MV =   |y2|  | -sinX.sinY.x + cosX.y - sinX.cosY.z   |
                    |z2|  |  cosX.sinY.x + sinX.y + cosX.cosY.z   |
            */
            return [
                C, 0, -D, -B * D, A, -B * C,
                A * D, B, A * C
            ]
        }
        //------------------------------------------------------------------------------
    function m3_x_m3(a1, a2) {
            /*mult 2 3x3 matrices:  [a1][a2]= //m3xm3
                                            a1=[    0, 1, 2,
                                                    3, 4, 5,
                                                    6, 7, 8         ]       */
            return [
                a1[0] * a2[0] + a1[1] * a2[3] + a1[2] * a2[6], a1[0] * a2[1] + a1[1] * a2[4] + a1[2] * a2[7], a1[0] * a2[2] + a1[1] * a2[5] + a1[2] * a2[8],
                a1[3] * a2[0] + a1[4] * a2[3] + a1[5] * a2[6], a1[3] * a2[1] + a1[4] * a2[4] + a1[5] * a2[7], a1[3] * a2[2] + a1[4] * a2[5] + a1[5] * a2[8],
                a1[6] * a2[0] + a1[7] * a2[3] + a1[8] * a2[6], a1[6] * a2[1] + a1[7] * a2[4] + a1[8] * a2[7], a1[6] * a2[2] + a1[7] * a2[5] + a1[8] * a2[8],
            ]
        }
        //------------------------------------------------------------------------------
    function m3_x_v3(a1, a2) { //mult matrice and vector: [3x3]*[3x1]
            /*
              [a1][xyz] =

              [   0, 1, 2,][x]
              [   3, 4, 5,][y]
              [   6, 7, 8 ][z]

            a1,a2 are actually 1 line vectors for performance
            returns a 1 line vector [x,y,z]
                                            */
            var x = 0,
                y = 1,
                z = 2;
            return [
                a1[0] * a2[x] + a1[1] * a2[y] + a1[2] * a2[z],
                a1[3] * a2[x] + a1[4] * a2[y] + a1[5] * a2[z],
                a1[6] * a2[x] + a1[7] * a2[y] + a1[8] * a2[z],
            ]
        }
        //------------------------------------------------------------------------------
    var startDraw = +new Date(); // starting value
    function draw() {
            var millisecs = (+new Date - startDraw),
                middle;
            startDraw = +new Date()
            initialise_draw();
            for (var nP = 0; nP < planes.length; nP++) {
                var p = planes[nP]; //grab next plane from array
                totalRotation = rotatePoints(p, totalRotation);
                //var p2_x=p[g1]._y
                var start1 = 0,
                    end1 = g2,
                    width = canvas1.width,
                    height = canvas1.height
                middle = Math.round(p.length / 2 - g2 / 2 - 1);
                ctx.lineWidth = 1;
                ctx.strokeStyle = "grey";
                for (var row = start1; row < end1; row++)
                    for (var col = start1; col < end1; col++) {
                        //var b=row*g2+col; //draws squares vertically down
                        var b = col * g2 + row; // draws squares horizontally to right
                        var point = p[b]
                        if (
                            (point._x < width - 10) &&
                            (point._x > 0) ||
                            (point._y < height - 10) &&
                            (point._y > 0)
                        )
                            paintSquare(p, b, b === middle);
                    }
            } //end drawing all planes
            drawMseBox(outerX, outerY, stopXY);
            if (help_dialog) showHELP()
            document.getElementById("msg_fps").innerHTML = Math.round(1000 / (millisecs))
            document.getElementById("msgtop1").innerHTML = millisecs
        } //draw
    onkeydown = onkeyup = function(e) {
        // if this is a keydown event, keyDOWN gets the value 1, otherwise 0
        var keyDOWN = e.type[5] ? true : false,
            key = e.keyCode,
            arrow = [37, 38, 39, 40],
            left = 0,
            up = 1,
            right = 2,
            down = 3;
        if (key === arrow[up]) movePlane("up", 1);
        if (key === arrow[down]) movePlane("up", -1);
        if (key === arrow[left]) movePlane("right", 1);
        if (key === arrow[right]) movePlane("right", -1);
    }

    function move_planes(x, y) {
        for (var nP = 0; nP < planes.length; nP++) {
            var p = planes[nP]; //grab next plane from array
            var p1 = p.length;
            while (p1--) {
                p[p1].x += x;
                p[p1].y += y;
            }
        } //end moving all planes
    }

    function movePlane(direction, amount) {
        if (direction === 'up') {
            move_planes(0, amount);
        }
        if (direction === 'right') {
            move_planes(-amount, 0);
        }
        draw();
        offTimer
    }

    function centre_planes() {
        for (var nP = 0; nP < planes.length; nP++) {
            var p = planes[nP]; //grab next plane from array
            var p1 = p.length;
            while (p1--) {
                p[p1].x= p[p1].x0;
                p[p1].y= p[p1].y0;
                p[p1].z   = p[p1].z0;
            }
        } //end moving all planes
    }
    var planes = []
    var playerPos = [{}]
    var p1 = makeGrid(fn1a);
    //p1=makeGrid(fn1);
    //add_shadow(p1);
    //alert('hi' + p1[1].color) ;
    planes.push(p1);
    //p2=makeGrid(fn2); planes.push(p2)
    //var planes=[p1,p2];
    draw()
})()


// vec2f World::world_to_screen(vec3f world_position) {
//     vec2i screen_size = Lex_Engine::get_screen_size();

//     vec4f clip_space = _projection_matrix * _view_matrix * object_matrix *vec4f(world_position.x, world_position.y, world_position.z, 1);

//     vec3f normalised_device_coordinates = vec3f(clip_space.x, clip_space.y, clip_space.z) / clip_space.w;
//     vec2f window_space_position = (vec2f(normalised_device_coordinates.x + 1.0 f, normalised_device_coordinates.y + 1.0 f)) / 2.0 f;
//     window_space_position.x = window_space_position.x * (float) screen_size.x; // + viewOffset;
//     window_space_position.y = window_space_position.y * (float) screen_size.y; // + viewOffset;
//     return window_space_position;
// }



// !
