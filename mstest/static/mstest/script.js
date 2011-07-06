$(document).ready(function() {
	// alert($('div.module:first h1').width())
	/*
	 * $('div.module.builder').draggable({ // handle: 'p:first', opacity : 0.5,
	 * revert : 'invalid' // containment : 'parent' });
	 */
	$('div.module').draggable({
		// handle: 'p:first',
		opacity : 0.5,
		helper : 'clone',
		revert : 'invalid'
	// containment : 'parent'
	});
	$('#builder').droppable({
		activeClass : 'highlight',
		hoverClass : 'highlight-accept',
		drop : function(event, ui) {
			console.log(ui.position);
			console.log($(ui.draggable).offset());
			console.log($(ui.helper).offset());
			dropModule(ui);
		}
	});

});

function dropModule(which) {
	var $this = $(which.draggable).clone();
	// $this.appendTo('#builder');

	// create container
/*	console.log('height' + $(which).outerHeight())
	console.log('left' + $this.offset().left)
	console.log('top' + $this.offset().top)
	console.log('width' + $this.outerWidth())*/
	$this.draggable({
		// handle: 'p:first',
		opacity : 0.5,
		helper : 'clone',
		revert : 'invalid'
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

}