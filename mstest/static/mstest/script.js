$(document).ready(function() {
	
	$('.module').draggable({
		handle: 'div.module',
		opacity : 0.5,
		helper : 'clone',
		revert : 'invalid',
		//drag : dragHandler
		cancel : '.edit,.inlet'
	// containment : 'parent'
	});
	$('.module > .edit').disableSelection();
	$('#builder').droppable({ 
		activeClass : 'highlight',
		hoverClass : 'highlight-accept',
		drop : function(event, ui) {
			/*
console.log(ui.position);
			console.log($(ui.draggable).offset());
			console.log($(ui.helper).offset());
*/
			dropModule(ui);
		}
	});
	//$("#builder .inlet,#builder .outlet").addClass('clickable')
	$("#builder .inlet,#builder .outlet").live({
  		click: builderClick 
	/*
,
  		mouseover: function() {
    	console.log('hovering')
  }
*/
	});
	
	
	
	bwidth = $('#builder').outerWidth();
	bheight = $('#builder').outerHeight();
	// global vars
	builderTop = $('#builder').offset().top
	builderLeft = $('#builder').offset().left
	bcanvas = document.getElementById("painter");
	bcanvas.width = bwidth;
	bcanvas.height = bheight
    bcontext = bcanvas.getContext("2d");
	//bcanvas.unbind();
	$('#painter').css({
		left : builderLeft,
		top : builderTop
	});
	$('#painter').attr({width:bwidth,height:bheight});
	
	/*
window.Snajo.Flow = function(){
		this
	}
*/
	make_id = function(init) {var count = init;return function() {return count++;}}
	getNewModuleId = make_id(1);
	getNewConnectionId = make_id(1);
	
	Flow = function() {
		this.addConnection = function() {}
	}

});

function Flow_addConnection() {
	
}

function builderClick(event)
{
	var msg = '(layerX,layerY)=(' + event.layerX + ',' + event.layerY + ') ';
	msg += '(screenX,screenY)=(' + event.screenX + ',' + event.screenY + ') ';
	msg += '(clientX,clientY)=(' + event.clientX + ',' + event.clientY + ') ';
	msg += '(pageX,pageY)=(' + event.pageX + ',' + event.pageY + ') ';
	msg += '(offsetX,offsetY)=(' + event.offsetX + ',' + event.offsetY + ')';
	var message = $('#message').text(msg);
	var partner = $(this).hasClass('inlet') ? 'outlet' : 'inlet';
	if ($('#builder .start').length == 0) {
		$(this).addClass('start');
		var type = $(this).attr('type');
		$('#builder .' + partner).not('.connected').filter('[type="'+type+'"]').addClass('compatible');
		//add move handler
		startElement = $(this);
		$('#builder').mousemove(make_showConnection(startElement));
	} else {
		$('#builder').unbind('mousemove');
		if (!$(this).hasClass('compatible')) {
			// clicked on incompatible class => reset
			$('#builder .start').removeClass('start');
			$('#builder .compatible').removeClass('compatible');
			//resetCanvas(bcanvas);
			removeTentativeConnection();
		} else {
			// clicked on compatible class => connect
			$(this).addClass('connected')
			$('#builder .start').addClass('connected').removeClass('start');
			$('#builder .compatible').removeClass('compatible');
			makePermanentConnection(startElement,$(this));
		}
			
	}
    //$(this).toggleClass('start')
    //console.log($(this).attr('type'))

}

function resetCanvas(canvas){
	canvas.width = canvas.width-1;
	canvas.width = canvas.width+1;
}
function drawLine2(event){
	var posX = event.pageX - builderLeft;
	var posY = event.pageY - builderTop;
	//reset canvas - webkit requires different value
	resetCanvas(bcanvas);
	bcontext.strokeStyle = "#000";
	bcontext.beginPath()
	bcontext.moveTo(startPosX- builderLeft,startPosY- builderTop);
  	bcontext.lineTo(posX, posY);
	bcontext.stroke();
	
	
}

function drawLine(element,startX,startY,endX,endY,radius,excludeRadius1,excludeRadius2){
	r2 = radius*2;
	var dx = endX-startX;
	var dy = endY-startY;
	var l = Math.sqrt(dx*dx+dy*dy);	
	var n = Math.floor(l/r2)-1;
	var dt = 1.0/n;
	var dl = l/n;
	// zero means always draw
	if (excludeRadius1 == 0) excludeRadius1 = -1e5;
	if (excludeRadius2 == 0) excludeRadius2 = -1e5;
		
	for (var i = 1; i <= n; i += 1) {
		if ((i * dl - radius) < excludeRadius1 || ((n - i) * dl - radius) < excludeRadius2) 
			continue;
		var px = startX + i * dt * dx - radius;
		var py = startPosY + i * dt * dy - radius;
		$(element).css({
			position: 'absolute',
			top: py,
			left: px
		}).appendTo('#builder');
	}
}

function removeTentativeConnection(){
	$('.marker.tentative').remove();
}
function makePermanentConnection(fromElement,toElement){
	removeTentativeConnection();
	var startPosX = $(fromElement).offset().left+$(fromElement).outerWidth()/2;
	var startPosY = $(fromElement).offset().top+$(fromElement).outerHeight()/2;
	var endPosX = $(toElement).offset().left+$(toElement).outerWidth()/2;
	var endPosY = $(toElement).offset().top+$(toElement).outerHeight()/2;
	var fromExcludeRadius = $(fromElement).outerWidth()/2;
	var toExcludeRadius = $(toElement).outerWidth()/2;
	var radius = 5;
	drawLine('<div class="marker permanent" id="' + getNewConnectionId() + '"></div>',
				startPosX,startPosY,endPosX,endPosY,radius,fromExcludeRadius,toExcludeRadius);
}

function make_showConnection(fromElement) {
	startPosX = $(fromElement).offset().left+$(fromElement).outerWidth()/2;
	startPosY = $(fromElement).offset().top+$(fromElement).outerHeight()/2;
	 return function showConnection(event){
		var posX = event.pageX;
		var posY = event.pageY;
		removeTentativeConnection();
		
		radius = 5;
		fromExcludeRadius = $(fromElement).outerWidth()/2;
		toExcludeRadius = 1;
		drawLine('<div class="marker tentative"></div>',
				startPosX,startPosY,posX,posY,radius,fromExcludeRadius,1);	
	}
}


function dropModule(which) {
	if ($(which.draggable).parents().is('#builder')) {return;}
	var $this = $(which.draggable).clone();
	$this.attr('id',getNewModuleId());
	// create container
	$this.draggable({
		// handle: 'p:first',
		opacity : 0.5,
		//helper : 'clone',
		revert : 'invalid',
		cancel : '.settings'
	// containment : 'parent'
	});
	$this.css({
		height : $(which.helper).outerHeight(),
		left : $(which.helper).offset().left,
		top : $(which.helper).offset().top,
		width : $(which.helper).outerWidth(),
		position : 'absolute'
		//overflow : 'hidden'
	}).appendTo('#builder');
	var mytype = $this.attr('type');
	var mysettings = $('.settings-template').filter('[type="'+mytype+'"]').clone();
	$this.find('.edit').attr('onclick',"$(this).parent().find('.settings').toggle()");
	mysettings.removeClass('settings-template').addClass('settings').hide().appendTo($this);
	mysettings.css({
		position:'absolute',
		top:($this.find('.edit').outerHeight()+$this.find('.edit').position().top+10) + 'px',
		left:($this.outerWidth() - mysettings.outerWidth())/2
	});
	
mysettings.draggable({
		//handle: '.header',
		opacity : 0.5
	});

	

}

function dragHandler(event,ui){
	msg = '(layerX,layerY)=(' + event.layerX + ',' + event.layerY + ')';
	var message = $('#message').text(msg);
	//.innerHTML('');
}

// http://bililite.com/blog/2009/01/16/jquery-css-parser/
