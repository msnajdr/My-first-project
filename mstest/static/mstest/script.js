$(document).ready(function() {

	$('.module').draggable({
		handle : 'div.module',
		opacity : 0.5,
		helper : 'clone',
		revert : 'invalid',
		//drag : dragHandler,
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
		click : builderClick
		/*
		 ,
		 mouseover: function() {
		 console.log('hovering')
		 }
		 */
	});
	$(".marker.permanent").live("mouseover mouseout click", function(event) {
		var connectionId = $(this).attr('connection_id');
		var selector = '[connection_id="' + connectionId + '"]';
		var index = flow.connectionsStatusDb.find({
			id : connectionId
		});
		var status = flow.connectionsStatusDb.get(index)[0].status;

		if(event.type == "mouseover") {
			if(status === 'selected')
				return;
			$(selector).addClass('active');
			flow.connectionsStatusDb.update({
				status : 'active'
			}, index);
		} else if(event.type == "mouseout") {
			if(status === 'selected')
				return;
			$(selector).removeClass('active');
			flow.connectionsStatusDb.update({
				status : 'passive'
			}, index);
		} else if(event.type == "click") {
			if(status === 'selected') {
				$(selector).removeClass('selected');
				flow.connectionsStatusDb.update({
					status : 'passive'
				}, index);
			} else {
				$(selector).addClass('selected');
				flow.connectionsStatusDb.update({
					status : 'selected'
				}, index);
			}
		}
	});
	$('.module').live("click", function(event) {
		var connectionId = $(this).attr('id');
		var index = flow.moduleDb.find({
			id : connectionId
		});
		var status = flow.moduleDb.get(index)[0].status;
		if(event.type == 'click') {
			if(status === 'selected') {
				$(this).removeClass('selected');
				flow.moduleDb.update({
					status : 'passive'
				}, index);
			} else {
				$(this).addClass('selected');
				flow.moduleDb.update({
					status : 'selected'
				}, index);
			}
		}
	});
	$('.module .edit').live('click', function(event) {
		$(this).parent().find('.settings').toggle();
		event.stopPropagation();
	});
	$('.control').click(controlClick);
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
	$('#painter').attr({
		width : bwidth,
		height : bheight
	});

	/*
	 window.Snajo.Flow = function(){
	 this
	 }
	 */
	make_id = function(init) {
		var count = init;
		return function() {
			return count++;
		}
	}
	Flow = function() {
		this.getNewConnectionId = make_id(1);
		this.getNewModuleId = make_id(1);
		this.addConnection = Flow_addConnection;
		this.redrawConnection = Flow_redrawConnection;
		this.clearConnection = FLow_clearConnection;
		this.removeSelectedConnections = Flow_removeSelectedConnections;
		this.removeConnection = Flow_removeConnection;
		this.getConnectionAnchors = Flow_getConnectionAnchors;
		this.addModule = Flow_addModule;
		this.removeSelectedModules = Flow_removeSelectedModules;
		this.removeModule = Flow_removeModule;
		this.connectionsDb = TAFFY();
		this.connectionsStatusDb = TAFFY();
		this.moduleDb = TAFFY();
		// create connection database
	}
	flow = new Flow();
});
function Flow_removeSelectedModules() {
	var selectedModules = this.moduleDb.get({
		status : 'selected'
	});
	for(var i = 0; i < selectedModules.length; i += 1) {
		var connectionId = selectedModules[i].id;
		this.removeModule(connectionId);
	}
}

function Flow_removeModule(id) {
	// find all connections related to this module and remove them first
	var connectionsToRemove = flow.connectionsDb.get({
		moduleId : id
	});
	for(var i = 0; i < connectionsToRemove.length; i += 1) {
		this.removeConnection(connectionsToRemove[i].id);
	}
	$('#'+id).remove();
	this.moduleDb.remove({
		id : id
	});
}

function Flow_addModule(type) {
	var moduleId = 'module_' + this.getNewModuleId();
	this.moduleDb.insert({
		id : moduleId,
		type : type,
		status : 'passive'
	});
	return moduleId;
}

function controlClick(event) {
	var clicked = $(this).attr('id');
	if(clicked === 'delete') {
		flow.removeSelectedConnections();
		flow.removeSelectedModules();
	} else if(clicked === 'run') {
		sendData = {
			connections : flow.connectionsDb.stringify(),
			modules : flow.moduleDb.stringify()
		}
		//sendData = {connections:"hoho"};
		$.get("/mstest/run/", sendData, function(data) {
			console.log(data.name);
		}, "json");
	}
}

function Flow_removeSelectedConnections() {
	//
	var selectedConenctions = this.connectionsStatusDb.get({
		status : 'selected'
	});
	for(var i = 0; i < selectedConenctions.length; i += 1) {
		var connectionId = selectedConenctions[i].id;
		this.removeConnection(connectionId);
	}
}

function Flow_removeConnection(id) {
	this.clearConnection(id);
	anchors = this.getConnectionAnchors(id);
	anchors[0].removeClass('connected');
	anchors[1].removeClass('connected');
	this.connectionsDb.remove({
		id : id
	});
	this.connectionsStatusDb.remove({
		id : id
	});
}

function Flow_addConnection(fromElement, toElement) {
	var connectionId = this.getNewConnectionId();
	makePermanentConnection(fromElement, toElement, connectionId);
	fromConnection = {
		id : connectionId,
		moduleId : fromElement.parent().attr('id'),
		type : fromElement.hasClass('inlet') ? 'inlet' : 'outlet',
		anchorId : fromElement.attr('gate_id')
	}
	toConnection = {
		id : connectionId,
		moduleId : toElement.parent().attr('id'),
		type : toElement.hasClass('inlet') ? 'inlet' : 'outlet',
		anchorId : toElement.attr('gate_id')
	}
	this.connectionsDb.insert([fromConnection, toConnection]);
	this.connectionsStatusDb.insert({
		id : connectionId,
		status : 'passive'
	});
	// hook drag function
	toElement.parent().draggable({
		drag : moduleDrag
	});
	fromElement.parent().draggable({
		drag : moduleDrag
	});

}

function moduleDrag(event, ui) {
	// check which connections need to be updated
	var moduleId = $(this).attr('id');
	var connections = flow.connectionsDb.get({
		moduleId : moduleId
	});
	for(var i = 0; i < connections.length; i += 1) {
		var connectionId = connections[i].id;
		flow.redrawConnection(connectionId);
	}
}

function FLow_clearConnection(id) {
	$('.marker.permanent[connection_id="' + id + '"]"').remove();
}

function Flow_getConnectionAnchors(id) {
	var c = this.connectionsDb.get({
		id : id
	});
	var sel1 = '#' + c[0].moduleId + ' .' + c[0].type + '[gate_id="' + c[0].anchorId + '"]';
	var sel2 = '#' + c[1].moduleId + ' .' + c[1].type + '[gate_id="' + c[1].anchorId + '"]';
	return [$(sel1), $(sel2)];
}

function Flow_redrawConnection(id) {
	// clear connection
	this.clearConnection(id);
	anchors = this.getConnectionAnchors(id);
	drawConnection(anchors[0], anchors[1], id);
}

function builderClick(event) {
	var msg = '(layerX,layerY)=(' + event.layerX + ',' + event.layerY + ') ';
	msg += '(screenX,screenY)=(' + event.screenX + ',' + event.screenY + ') ';
	msg += '(clientX,clientY)=(' + event.clientX + ',' + event.clientY + ') ';
	msg += '(pageX,pageY)=(' + event.pageX + ',' + event.pageY + ') ';
	msg += '(offsetX,offsetY)=(' + event.offsetX + ',' + event.offsetY + ')';
	var message = $('#message').text(msg);
	var partner = $(this).hasClass('inlet') ? 'outlet' : 'inlet';
	if($('#builder .start').length == 0) {
		$(this).addClass('start');
		var type = $(this).attr('type');
		$('#builder .' + partner).not('.connected').filter('[type="'+type+'"]').addClass('compatible');
		//add move handler
		startElement = $(this);
		$('#builder').mousemove(make_showConnection(startElement));
	} else {
		$('#builder').unbind('mousemove');
		if(!$(this).hasClass('compatible')) {
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
			flow.addConnection(startElement, $(this));
		}

	}
	//$(this).toggleClass('start')
	//console.log($(this).attr('type'))
	return false;
	// do not propagate further
}

function resetCanvas(canvas) {
	canvas.width = canvas.width - 1;
	canvas.width = canvas.width + 1;
}

function drawLine2(event) {
	var posX = event.pageX - builderLeft;
	var posY = event.pageY - builderTop;
	//reset canvas - webkit requires different value
	resetCanvas(bcanvas);
	bcontext.strokeStyle = "#000";
	bcontext.beginPath()
	bcontext.moveTo( startPosX - builderLeft, startPosY - builderTop);
	bcontext.lineTo(posX, posY);
	bcontext.stroke();

}

function drawLine(element, startX, startY, endX, endY, radius, excludeRadius1, excludeRadius2) {
	r2 = radius * 2;
	var dx = endX - startX;
	var dy = endY - startY;
	var l = Math.sqrt(dx * dx + dy * dy);
	var n =    Math.floor(l / r2) - 1;
	var dt = 1.0 / n;
	var dl = l / n;
	// zero means always draw
	if(excludeRadius1 == 0)
		excludeRadius1 = -1e5;
	if(excludeRadius2 == 0)
		excludeRadius2 = -1e5;

	for(var i = 1; i <= n; i += 1) {
		if((i * dl - radius) < excludeRadius1 || (( n - i) * dl - radius) < excludeRadius2)
			continue;
		var px = startX + i * dt * dx - radius;
		var py = startY + i * dt * dy - radius;
		$(element).css({
		position: 'absolute',
		top: py,
		left: px
		}).appendTo('#builder');
	}
}

function removeTentativeConnection() {
	$('.marker.tentative').remove();
}

function makePermanentConnection(fromElement, toElement, id) {
	removeTentativeConnection();
	drawConnection(fromElement, toElement, id);
}

function drawConnection(fromElement, toElement, id) {
	var startPosX = $(fromElement).offset().left + $(fromElement).outerWidth() / 2;
	var startPosY = $(fromElement).offset().top + $(fromElement).outerHeight() / 2;
	var endPosX = $(toElement).offset().left + $(toElement).outerWidth() / 2;
	var endPosY = $(toElement).offset().top + $(toElement).outerHeight() / 2;
	var msg = '(startPosX,startPosY)=(' + startPosX + ',' + startPosY + ') ';
	msg += '(endPosX,endPosY)=(' + endPosX + ',' + endPosY + ') ';
	//msg += '(clientX,clientY)=(' + event.clientX + ',' + event.clientY + ') ';
	//msg += '(pageX,pageY)=(' + event.pageX + ',' + event.pageY + ') ';
	//msg += '(offsetX,offsetY)=(' + event.offsetX + ',' + event.offsetY + ')';
	var message = $('#message').text(msg);
	var fromExcludeRadius = $(fromElement).outerWidth() / 2;
	var toExcludeRadius = $(toElement).outerWidth() / 2;
	var radius = 5;
	drawLine('<div class="marker permanent" connection_id="' + id + '"></div>', startPosX, startPosY, endPosX, endPosY, radius, fromExcludeRadius, toExcludeRadius);
}

function make_showConnection(fromElement) {
	startPosX = $(fromElement).offset().left + $(fromElement).outerWidth() / 2;
	startPosY = $(fromElement).offset().top + $(fromElement).outerHeight() / 2;
	return function showConnection(event) {
		var posX = event.pageX;
		var posY = event.pageY;
		removeTentativeConnection();
		radius = 5;
		fromExcludeRadius = $(fromElement).outerWidth() / 2;
		toExcludeRadius = 1;
		drawLine('<div class="marker tentative"></div>', startPosX, startPosY, posX, posY, radius, fromExcludeRadius, 1);
	}
}

function dropModule(which) {
	if($(which.draggable).parents().is('#builder')) {
		return;
	}
	var $this = $(which.draggable).clone();
	var moduleId = flow.addModule($this.attr('type'));
	$this.attr('id', moduleId);
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
	mysettings.removeClass('settings-template').addClass('settings').hide().appendTo($this);
	mysettings.css({
		position : 'absolute',
		top : ($this.find('.edit').outerHeight() + $this.find('.edit').position().top + 10) + 'px',
		left : ($this.outerWidth() -    mysettings.outerWidth()) / 2
	});

	mysettings.draggable({
		//handle: '.header',
		opacity : 0.5
	});

}

function dragHandler(event, ui) {
	msg = '(layerX,layerY)=(' + event.layerX + ',' + event.layerY + ')';
	var message = $('#message').text(msg);
	//.innerHTML('');
}

// http://bililite.com/blog/2009/01/16/jquery-css-parser/