
function Run(){
    console.log("Start");

    var canvas = InitCanvas();
    var ctx = canvas.getContext("2d");

    About.setAbout("right");

    WebGLCanvas.loadShaders();

    Program.GetChargePropertiesTable().style.display = "none";

    mousePos = new Vector2();
    window.addEventListener("mousemove", function (e){
        mousePos = new Vector2(e.x, e.y);
    });
    window.addEventListener("mousedown", function (e){
        if (e.which == 1){
            mouseDown = true;
            mouseClick = true;
        }
        if (e.which == 2){
            mouse3Down = true;
        }
        if (controlDown) {
            if (e.which == 1){
                let n = new Charge(mousePos, Charge.ChargeType.POSITIVE);
                lastSelected = n;
                Program.PropertiesTable_GetChargeValues();
            }
            else if (e.which == 3){
                let n = new Charge(mousePos, Charge.ChargeType.NEGATIVE);
                lastSelected = n;
                Program.PropertiesTable_GetChargeValues();
            }
            else if (e.which == 2){
                let n = new Sensor(mousePos);
                lastSelected = n;
            }
        }
        if (shiftDown) {
            if (e.which == 1){
                let n = new Line(mousePos);
                lastSelected = n;
            }
        }
    });
    window.addEventListener("mouseup", function (e){
        mouseDown = false;
        draggingTarget = null;
        if (e.which == 2){
            mouse3Down = false;
        }
    });
    window.addEventListener("keydown", function (e){
        if (e.key == "Delete"){
            Program.PAGE_DeleteSelected();
        }
        if (e.key == "Control"){
            controlDown = true;
        }
        if (e.key == "Shift"){
            shiftDown = true;
        }
    });
    window.addEventListener("keyup", function (e){
        if (e.key == "Control"){
            controlDown = false;
        }
        if (e.key == "Shift"){
            shiftDown = false;
        }
    });

    CreateSensors(Math.floor(canvas.clientWidth/Program.SENSORDENSITY),
                    Math.floor(canvas.clientHeight/Program.SENSORDENSITY));

    function update(){
        UpdateCanvas(canvas);
        UpdateElements();
        Program.EmitParticlesByClick();
        Program.EmissionPulse();
        Program.PropertiesTable_SetChargeValues();
        Program.UpdateScreenVectorGrayscale();
        DrawElements(ctx);
        mouseClick = false;

        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}
var draggingTarget;
var listOfLastSelected;
var lastSelected;
var mousePos;
var mouseDown;
var mouse3Down;
var mouseClick;
var controlDown = false;
var shiftDown = false;

class Program
{
    static SENSORDENSITY = 25;
    static screenVectorTranparency = 200;

    static fieldVisualization = false;
    
    static emitParticles = false;
    static emit = false;
    static timeSinceLastEmission = 0;
    static emissionRate = 7;
    static EmissionPulse(){
        Program.emit = false;
        Program.timeSinceLastEmission += 1;
        if (Program.timeSinceLastEmission > Program.emissionRate/2){
            Program.emit = true;
            Program.timeSinceLastEmission = 0;
        }
        if (!Charge.chargeList.length > 0){
            Program.ClearAllParticles();
        }
    }
    static GetChargePropertiesTable(){
        return document.getElementById("chargepropertiestable");
    }
    static PropertiesTable_SetChargeValues(){
        var chargeForce = document.getElementById("chargeforce");
        var chargeType = document.getElementById("chargetype");
        var chargeEmitParticles = document.getElementById("chargeemitparticles");
        
        if (chargeForce.value < 1){
            chargeForce.value = 1;
        }
        if (chargeForce.value > 10000){
            chargeForce.value = 10000;
        }
        if (lastSelected != null && lastSelected instanceof Charge){
            lastSelected.chargeForce = chargeForce.value;
        }
    
        let defineCharge;
        if (chargeType.options[chargeType.selectedIndex].value == "positive"){
            defineCharge = Charge.ChargeType.POSITIVE;
        } else {
            defineCharge = Charge.ChargeType.NEGATIVE;
        }
        if (lastSelected != null && lastSelected instanceof Charge){
            lastSelected.charge = defineCharge;
        }
    
        if (lastSelected != null && lastSelected instanceof Charge){
            lastSelected.enableEmitParticles = chargeEmitParticles.checked;
            if (lastSelected.charge == Charge.ChargeType.POSITIVE){
                if (Program.emitParticles){
                    chargeEmitParticles.style.display = "block";
                    document.getElementById("chargeemitparticles_text").style.display = "block";
                } else {
                    chargeEmitParticles.style.display = "none";
                    document.getElementById("chargeemitparticles_text").style.display = "none";
                }
            } else {
                chargeEmitParticles.style.display = "none";
                document.getElementById("chargeemitparticles_text").style.display = "none";
            }
        }
    }
    static PropertiesTable_GetChargeValues(){
        var chargeForce = document.getElementById("chargeforce");
        var chargeType = document.getElementById("chargetype");
        var chargeEmitParticles = document.getElementById("chargeemitparticles");
        chargeForce.value = lastSelected.chargeForce;
        let selectedCharge;
        if (lastSelected.charge == Charge.ChargeType.POSITIVE){
            selectedCharge = "positive";
        } else {
            selectedCharge = "negative";
        }
        chargeType.value = selectedCharge;
        chargeEmitParticles.checked = lastSelected.enableEmitParticles;
    }
    
    static UpdateScreenVectorGrayscale(){
        var sliderValue = document.getElementById("screenvectorgrayscale").value;
        Program.screenVectorTranparency = sliderValue;
    }
    
    static EmitParticlesByClick(){
        if (Program.emitParticles){
            if (!controlDown){
                if (mouse3Down){
                    if (Program.emit){
                        new Particle(mousePos);
                    }
                }
            }
        }
    }
    static UpdateEmitParticles(){
        //CreateParticles(Math.floor(canvas.clientWidth/Program.SENSORDENSITY), Math.floor(canvas.clientHeight/Program.SENSORDENSITY));
        Program.emitParticles = document.getElementById("emitparticlescheck").checked;
        if (!Program.emitParticles){
            Program.ClearAllParticles();
            document.getElementById("clearallparticles").style.display = "none";
        } else {
            document.getElementById("clearallparticles").style.display = "block";
        }
    }
    
    static UpdateFieldVisualization(){
        Program.fieldVisualization = document.getElementById("fieldvisualizationcheck").checked;
        if (Program.fieldVisualization){
            WebGLCanvas.start();
            WebGLCanvas.render = true;
            Program.ClearAllParticles();
        }
        else {
            WebGLCanvas.render = false;
        }
    }

    static PAGE_DeleteSelected(){
        if (lastSelected != null){
            listOfLastSelected.splice(listOfLastSelected.indexOf(lastSelected), 1);
            lastSelected = null;
            Program.GetChargePropertiesTable().style.display = "none";
        }
    }
    static PAGE_DeleteAll(){
        let lists = [Charge.chargeList, Sensor.sensorList, Line.linesList];
        lists.forEach(element => {
            while (element.length > 0){
                element.pop(element[0]);
            }
        });
        while (Particle.particlesList.length > 0) {
            Particle.particlesList.pop();
        }
        Program.GetChargePropertiesTable().style.display = "none";
    }
    static PAGE_AddNCharge(){
        new Charge(new Vector2(window.innerWidth/2, window.innerHeight/2), Charge.ChargeType.NEGATIVE);
    }
    static PAGE_AddPCharge(){
        new Charge(new Vector2(window.innerWidth/2, window.innerHeight/2), Charge.ChargeType.POSITIVE);
    }
    static PAGE_AddSensor(){
        new Sensor(new Vector2(window.innerWidth/2, window.innerHeight/2));
    }
    static PAGE_AddLine(){
        new Line(new Vector2(window.innerWidth/2, window.innerHeight/2));
    }
    static ClearAllParticles(){
        while (Particle.particlesList.length > 0) {
            Particle.particlesList.pop();
        }
    }
}


function DrawElements(ctx){
    ScreenSensor.screenSensorList.forEach(element => element.Draw(ctx));
    Particle.particlesList.forEach(element => element.Draw(ctx));
    Line.linesList.forEach(element => element.Draw(ctx));
    Charge.chargeList.forEach(element => element.Draw(ctx));
    Sensor.sensorList.forEach(element => element.Draw(ctx));
}
function UpdateElements(){
    Sensor.sensorList.forEach(element => element.Drag());
    Line.linesList.forEach(element => element.Drag());
    Charge.chargeList.forEach(element => {element.Drag(); element.EmitParticles()});
    ScreenSensor.screenSensorList.forEach(element => element.CalculateVector());
    Sensor.sensorList.forEach(element => element.CalculateVector());
    Particle.particlesList.forEach(element => element.Move());
}
class Charge
{
    
    static chargeList = [];
    static ChargeType = { POSITIVE: 1, NEGATIVE: -1, };

    constructor (position, charge){
        
        this.position = position;
        this.charge = charge;
        this.radius = 20;
        this.chargeForce = 100;
        this.enableEmitParticles = true;

        // this.offsetToMouse = new Vector2();

        Charge.chargeList.push(this);

    }

    Draw(ctx){
        let fillColor;
        let strokeColor;
        let text;
        if (this.charge == Charge.ChargeType.POSITIVE){
            fillColor = "#E54F4F";
            text = "+";
        } else {
            fillColor = "#5F51D4";
            text = "-"
        }
        if (lastSelected == this){
            strokeColor = "#00FF55";
        } else {
            strokeColor = "white";
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 360);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = strokeColor;
        ctx.font = "30px Arial"
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, this.position.x, this.position.y);
    }

    EmitParticles(){
        if (Program.fieldVisualization){
            return;
        }
        if (Program.emitParticles && this.enableEmitParticles){
            if (this.charge == Charge.ChargeType.POSITIVE){
                if (Program.emit){
                    let amount = 20;
                    for (let i = 0; i < amount; i++){
                        let posx = this.position.x + Math.cos(((360 * i / amount) + 360/amount/2) * Math.PI/180) * this.radius;
                        let posy = this.position.y + Math.sin(((360 * i / amount) + 360/amount/2) * Math.PI/180) * this.radius;
                        new Particle(new Vector2(posx, posy));
                    }
                }
            }
        }
    }

    Drag(){
        if (mouseClick && draggingTarget == null){
            //lastSelected = null;
            if (this.position.GetDistanceTo(mousePos) < this.radius){
                this.offset = this.position.Sub(mousePos);
                draggingTarget = this;
                lastSelected = this;
                listOfLastSelected = Charge.chargeList;
                Program.PropertiesTable_GetChargeValues();
            }
        }
        
        if (draggingTarget == this){
            this.position = mousePos.Add(this.offset);
        }
        if (lastSelected == this){
            Program.GetChargePropertiesTable().style.display = "block";
        }
    }
    
}

class Sensor
{

    static sensorList = [];

    constructor (position) {
        this.position = position;

        this.angle = new Vector2(0,-1);

        this.outlineCircleRadius = 12;
        Sensor.sensorList.push(this);
    }

    Draw(ctx){
        let color = "#FFD815";
        //Circle in the base
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 5, 0, 360);
        ctx.fill();

        //Base circle outline (also shows the clickable area)
        let strokeColor;
        if (lastSelected == this){
            strokeColor = "#00FF55";
        } else {
            strokeColor = "white";
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.outlineCircleRadius, 0, 360);
        ctx.stroke();

        //Line
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        let posx = this.position.x + this.angle.x * 100;
        let posy = this.position.y + this.angle.y * 100;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(posx, posy);
        ctx.stroke();
    }

    Drag(){
        if (mouseClick && draggingTarget == null){
            //lastSelected = null;
            if (this.position.GetDistanceTo(mousePos) < this.outlineCircleRadius){
                this.offset = this.position.Sub(mousePos);
                draggingTarget = this;
                lastSelected = this;
                listOfLastSelected = Sensor.sensorList;
            }
        }
        
        if (draggingTarget == this){
            this.position = mousePos.Add(this.offset);
        }
        if (lastSelected == this){
            Program.GetChargePropertiesTable().style.display = "none";
        }
    }

    CalculateVector(){
        let finalAngle = new Vector2();

        Charge.chargeList.forEach(element => {
            let offset = element.position.Sub(this.position);
            offset = offset.Scale(1 / Math.pow(this.position.GetDistanceTo(element.position),2) * -element.charge * element.chargeForce);
            finalAngle = finalAngle.Add(offset);
        });

        this.angle = finalAngle;
    }

}

class Line
{

    static linesList = [];

    constructor(position){
        this.position = position;
        this.samples = 0.09;

        this.drawingOrigin = new Vector2();

        this.outlineCircleRadius = 12;

        Line.linesList.push(this);
    }

    Drag(){
        if (mouseClick && draggingTarget == null){
            //lastSelected = null;
            if (this.position.GetDistanceTo(mousePos) < this.outlineCircleRadius){
                this.offset = this.position.Sub(mousePos);
                draggingTarget = this;
                lastSelected = this;
                listOfLastSelected = Line.linesList;
            }
        }
        
        if (draggingTarget == this){
            this.position = mousePos.Add(this.offset);
        }
        if (lastSelected == this){
            Program.GetChargePropertiesTable().style.display = "none";
        }
    }

    Draw(ctx){
        //Draw clickable circle
        let strokeColor;
        if (lastSelected == this){
            strokeColor = "#00FF55";
        } else {
            strokeColor = "white";
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath()
        ctx.arc(this.position.x, this.position.y, this.outlineCircleRadius, 0, 360);
        ctx.stroke();

        //Draw lines
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.FindDrawingOrigin();
        var point = this.drawingOrigin;
        ctx.moveTo(point.x, point.y);
        while (true){
            if (!(this.CalculateNextPoint(point).x == 0 && this.CalculateNextPoint(point).y == 0)){
                point = point.Add(this.CalculateNextPoint(point));
                ctx.lineTo(point.x, point.y);
            } else { break; }
            
            let breakWhile = false;
            for (let element of Charge.chargeList) {
                if (point.GetDistanceTo(element.position) < element.radius){
                    breakWhile = true;
                    break;
                }
            } if (breakWhile){break;}

            if (point.x < 0 - canvas.clientWidth * 2 || point.x > canvas.clientWidth * 3){
                break;
            }
            if (point.y < 0 - canvas.clientWidth * 2 || point.y > canvas.clientWidth * 3){
                break;
            }
        }
        ctx.stroke();
    }

    CalculateNextPoint(currentPoint){
        let finalAngle = new Vector2();

        Charge.chargeList.forEach(element => {
            let distanceToElement = currentPoint.GetDistanceTo(element.position);
            if (distanceToElement != 0){
                let offset = element.position.Sub(currentPoint);
                offset = offset.Scale(1 / Math.pow(distanceToElement,2) * -element.charge * element.chargeForce);
                finalAngle = finalAngle.Add(offset);
            }
        });

        return finalAngle.Normalize().Scale(1/this.samples);
    }
    CalculatePreviousPoint(currentPoint){
        let finalAngle = new Vector2();

        for (let element of Charge.chargeList) {
            let distanceToElement = currentPoint.GetDistanceTo(element.position);
            // if (element.charge == Charge.ChargeType.POSITIVE && distanceToElement < element.charge.radius/3){
            //     this.drawingOrigin = element.position;
            //     return true;
            // }
            if (distanceToElement != 0){
                let offset = element.position.Sub(currentPoint);
                offset = offset.Scale(1 / Math.pow(distanceToElement,2) * element.charge * element.chargeForce);
                finalAngle = finalAngle.Add(offset);
            }
        }

        return finalAngle.Normalize().Scale(1/this.samples);
    }

    FindDrawingOrigin(){
        let point = this.position;
        while (true){
            let previousPoint = this.CalculatePreviousPoint(point);
            if (!(previousPoint.x == 0 && previousPoint.y == 0)){
                point = point.Add(previousPoint);
            } else { break; }
            
            let breakWhile = false;
            for (let element of Charge.chargeList) {
                if (point.GetDistanceTo(element.position) < element.radius){
                    breakWhile = true;
                    this.drawingOrigin = point;
                    break;
                }
            } if (breakWhile){break;}

            if (point.x < 0 - canvas.clientWidth * 2 || point.x > canvas.clientWidth * 3){
                this.drawingOrigin = point;
                break;
            }
            if (point.y < 0 - canvas.clientWidth * 2 || point.y > canvas.clientWidth * 3){
                this.drawingOrigin = point;
                break;
            }
        }
    }
}

class Particle
{

    static particlesList = [];

    constructor (position) {
        this.originalPos = position;
        this.position = position;
        this.nextPos = new Vector2();

        this.radius = 1.5;
        this.speed = 1/Program.emissionRate * Math.pow(7.5, 2);

        Particle.particlesList.push(this);
    }

    Draw(ctx){
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 360);
        ctx.fill();
    }

    Move(){
        this.CalculateVector()
        this.position = this.position.Add(this.nextPos.Normalize().Scale(this.speed));
        for (let element of Charge.chargeList) {
            if (this.position.GetDistanceTo(element.position) < element.radius){
                //this.position = this.originalPos;
                Particle.particlesList.splice(Particle.particlesList.indexOf(this), 1);
                break;
            }
        }
        if (this.position.x < 0 - canvas.clientWidth * 2 || this.position.x > canvas.clientWidth * 3){
            Particle.particlesList.splice(Particle.particlesList.indexOf(this), 1);
        }
        if (this.position.y < 0 - canvas.clientWidth * 2 || this.position.y > canvas.clientWidth * 3){
            Particle.particlesList.splice(Particle.particlesList.indexOf(this), 1);
        }
        //console.log(this.nextPos);
    }

    CalculateVector(){
        let finalAngle = new Vector2();

        Charge.chargeList.forEach(element => {
            let offset = element.position.Sub(this.position);
            offset = offset.Scale(1 / Math.pow(this.position.GetDistanceTo(element.position),2) * -element.charge * element.chargeForce);
            finalAngle = finalAngle.Add(offset);
        });

        this.nextPos = finalAngle;
    }

}

class ScreenSensor
{

    static screenSensorList = [];

    constructor (position) {
        this.position = position;

        this.angle = new Vector2(0,-1);
        this.lenght = Program.SENSORDENSITY * 0.9;

        ScreenSensor.screenSensorList.push(this);
    }

    Draw(ctx){

        let finalLenght = this.lenght * Math.sqrt(this.angle.Magnitude()) * 10;
        if (finalLenght > this.lenght){
            finalLenght = this.lenght;
        }

        let transp;
        let transWithParticles = 255 / 10;
        if (Program.fieldVisualization) {
            transp = 0;
        } else 
        if (Program.emitParticles){
            if (Program.screenVectorTranparency > transWithParticles){
                transp = transWithParticles;
            } else {
                transp = Program.screenVectorTranparency;
            }
        } else {
            transp = Program.screenVectorTranparency;
        }

        let strokeColor = `rgba(255, 255, 255, ${transp / 255})`;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        let posx = this.position.x + this.angle.Normalize().x * finalLenght;
        let posy = this.position.y + this.angle.Normalize().y * finalLenght;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(posx, posy);
        ctx.stroke();
    }

    CalculateVector(){
        let finalAngle = new Vector2();

        Charge.chargeList.forEach(element => {
            let offset = element.position.Sub(this.position);
            offset = offset.Scale(1 / Math.pow(this.position.GetDistanceTo(element.position),2) * -element.charge * element.chargeForce/100);
            finalAngle = finalAngle.Add(offset);
        });

        this.angle = finalAngle;
    }

}

class WebGLCanvas
{

    static vertexShader = null;
    static fragmentShader = null;
    static program;

    static canvas;
    static gl;

    static render

    static start(){

        let gl = WebGLCanvas.canvas.getContext("webgl");

        let vertexShader = WebGLCanvas.vertexShader;
        let fragmentShader = WebGLCanvas.fragmentShader;

        let vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vertexShader);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)){
            console.error(
                "Vertex shader compile error: ",
                gl.getShaderInfoLog(vs)
            );
        }

        let fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fragmentShader);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)){
            console.error(
                "Fragment shader compile error: ",
                gl.getShaderInfoLog(fs)
            );
        }

        //Creating program
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
            console.error(
                "Shader program link error: ",
                gl.getShaderInfoLog(program)
            );
        }
        
        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
            console.error(
                "Shader program validate error: ",
                gl.getShaderInfoLog(program)
            );
        }

        gl.useProgram(program);

        //Set CPU-side variables for all of our shader variables
        // let vpDimensions = [WebGLCanvas.canvas.width, WebGLCanvas.canvas.height];

        //Create buffers
        let vertexBuffer = gl.createBuffer();
        let vertices = [
            -1, 1,
            -1, -1,
            1, -1,

            -1, 1,
            1, 1,
            1, -1
        ];
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        var vPosAttrib = gl.getAttribLocation(program, "vPos");
        gl.vertexAttribPointer(
            vPosAttrib,
            2, gl.FLOAT,
            false,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        gl.enableVertexAttribArray(vPosAttrib);

        WebGLCanvas.gl = gl;
        WebGLCanvas.program = program;

        requestAnimationFrame(WebGLCanvas.update);
    }

    static update(){
        if (!WebGLCanvas.render){
            return;
        }

        /** @type {WebGLRenderingContext} */ 
        let gl = WebGLCanvas.gl;
        let program = WebGLCanvas.program;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniform1i(
            gl.getUniformLocation(program, "chargeCounter"),
            Charge.chargeList.length
        );

        for (let i = 0; i < Charge.chargeList.length; i++){
            let charge = Charge.chargeList[i];

            let posLoc = gl.getUniformLocation(program, `charges[${i}].pos`);
            gl.uniform2fv(posLoc, [charge.position.x, WebGLCanvas.canvas.height - charge.position.y]);
            let chargeLoc = gl.getUniformLocation(program, `charges[${i}].charge`);
            gl.uniform1i(chargeLoc, charge.charge);
            let forceLoc = gl.getUniformLocation(program, `charges[${i}].force`);
            gl.uniform1i(forceLoc, charge.chargeForce);
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(WebGLCanvas.update);
    }

    static loadShaders(){
        function loadShader(url, callback){
            const req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.onload = function(){
                if (req.status != 200){
                    callback("Could not load shader from " + url);
                } else {
                    callback(null, req.responseText);
                }
            }
            req.send();
        }

        loadShader("/mains.vs.glsl", function(err, vertexShader){
            if (err){
                console.error(`An error ocurred: '${err}'`);
                return;
            } else {
                loadShader("/mains.fs.glsl", function(err, fragmentShader){
                    if (err){
                        console.error(`An error ocurred: '${err}'`);
                        return;
                    } else {
                        WebGLCanvas.vertexShader = vertexShader;
                        WebGLCanvas.fragmentShader = fragmentShader;
                    }
                });
            }
        });
    }

}

function CreateSensors(w, h){
    let screenWidth = canvas.clientWidth;
    let screenHeight = canvas.clientHeight;
    for (x = 0; x <= w+1; x++){
        for (y = 0; y <= h+1; y++){
            let posx = x * (screenWidth / (w + 1));
            let posy = y * (screenHeight / (h + 1));
            new ScreenSensor(new Vector2(posx,posy));
        }
    }
}

class Vector2
{
    constructor (x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    Add(vector2){
        return new Vector2(this.x + vector2.x, this.y + vector2.y);
    }

    Sub(vector2){
        return new Vector2(this.x - vector2.x, this.y - vector2.y);
    }

    Scale(factor){
        return new Vector2(this.x * factor, this.y * factor);
    }

    Magnitude(){
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    Normalize(){
        if (this.Magnitude() == 0){
            return new Vector2();
        }
        else {
            return new Vector2(this.x / this.Magnitude(), this.y / this.Magnitude());
        }
    }

    GetDistanceTo(vector2){
        return this.Sub(vector2).Magnitude();
    }

}

function InitCanvas(){
    var canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    WebGLCanvas.canvas = document.getElementById("canvaswebgl");
    WebGLCanvas.canvas.width = window.innerWidth;
    WebGLCanvas.canvas.height = window.innerHeight;

    return canvas;
}

function UpdateCanvas(canvas){

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    if (!Program.fieldVisualization){
        ctx.fillStyle = "#202020";
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
}

window.onload = Run;
document.addEventListener('contextmenu', event => event.preventDefault());

function shhhh(qnt, r = 100){
    Charge.chargeList = [];
    for (let i = 0; i < qnt; i++){
        let angle = (i / qnt) * 2 * Math.PI;
        new Charge(
            new Vector2(Math.cos(angle), Math.sin(angle))
            .Scale(r)
            .Add(new Vector2(window.innerWidth, window.innerHeight).Scale(0.5)),
            Charge.ChargeType.POSITIVE
        );
    }
}

//  Feito por Victor Rosa :)
//  21/08/2019

//  Atualizado
//  20/07/2020
