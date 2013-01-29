/**
 * Created with JetBrains PhpStorm.
 * User: Adam
 * Date: 29/01/13
 * Time: 20:51
 * To change this template use File | Settings | File Templates.
 */


var midi = null,
	inputs = null,
	outputs = null,
	input = null,
	output = null,
	log = null;

midiControl = {

	init:  function(){
		if( !log ) {
			log = document.getElementById( "log" );
		}
		log.innerHTML = "Starting up MIDI...\n";
		navigator.requestMIDIAccess( midiControl.success, midiControl.failure );
	},

	handleMIDIMessage: function( ev ){
		// testing - just reflect.
		log.innerHTML += "Message: " + ev.data.length + " bytes, timestamp: " + ev.timestamp;
		if( ev.data.length == 3 ){
			//log.innerHTML += " 0x" + ev.data[0].toString( 16 ) + " 0x" + ev.data[1].toString( 16 ) + " 0x" + ev.data[2].toString( 16 );
			log.innerHTML += " " + ev.data[0] + " " + ev.data[1] + " " + ev.data[2];

			var $elem = $( '.commands' ).find( '*[name="' + ev.data[1] + '"]' );
			if($elem.hasClass('button')){
				if( ev.data[2]){
					$elem.addClass('pushed');
				}
				else {
					$elem.removeClass( 'pushed' );
				}
			}
			else if($elem.hasClass('knob')) {

				var volume = ev.data[2] / 127;

				$elem.val( volume * 100 )
					.trigger( 'change' );

				midiControl.audioElement.volume = volume;
			}
		}
		log.innerHTML += "\n";
		if( output ) {
			output.send( ev.data );
		}
	},

  success: function( midiAccess ){
		log.innerHTML += "MIDI ready!\n";
		midi = midiAccess;

		inputs = midi.getInputs();
		log.innerHTML += inputs.length + " inputs:\n";
		for( var i = 0; i < inputs.length; i++ ){
			log.innerHTML += i + ": " + inputs[i] + "\n";
		}

		if( inputs.length > 0 ){
			input = midi.getInput( inputs[0] );
			//		input.onmessage = handleMIDIMessage;
			input.addEventListener( "message", midiControl.handleMIDIMessage );
			log.innerHTML += "Hooked up first input.\n";
		}

		outputs = midi.getOutputs();
		log.innerHTML += outputs.length + " outputs:\n";
		for( var i = 0; i < outputs.length; i++ ){
			log.innerHTML += i + ": " + outputs[i] + "\n";
		}

		if( outputs.length ){
			output = midi.getOutput( outputs[0] );
			output.send( [0xb0, 0x00, 0x7f] );	// If the first device is a Novation Launchpad, this will light it up!
		}

	},

	failure: function( error ){
		alert( "Failed to initialize MIDI - " + ((error.code == 1) ? "permission denied" : ("error code " + error.code)) );
	}
}

$(document).ready(function(){

	/* stolen from http://www.position-relative.net/creation/audiotag/# */

	midiControl.audioElement = document.createElement( 'audio' );
	midiControl.audioElement.setAttribute( 'src', 'media/Mogwai2009-04-29_acidjack_t16.ogg' );
	midiControl.audioElement.load();
	midiControl.audioElement.addEventListener( "load", function(){
		midiControl.audioElement.play();
		//$( ".duration span" ).html( audioElement.duration );
		//$( ".filename span" ).html( audioElement.src );
	}, true );

	$('.power-wrapper' ).on('click', function(){
		midiControl.init();

		$(this).addClass( 'hide' );
		$('.commands').removeClass('hide');
		midiControl.audioElement.play();
	});

	/* jquery-know, see lib directory */

	$( ".knob" ).knob( {
						   change:  function( value ){
							   //console.log("change : " + value);
						   },
						   release: function( value ){
							   //console.log(this.$.attr('value'));
							   console.log( "release : " + value );
						   },
						   cancel:  function(){
							   console.log( "cancel : ", this );
						   },
						   draw:    function(){

							   // "tron" case
							   if( this.$.data( 'skin' ) == 'tron' ){

								   var a = this.angle( this.cv )  // Angle
									   , sa = this.startAngle          // Previous start angle
									   , sat = this.startAngle         // Start angle
									   , ea                            // Previous end angle
									   , eat = sat + a                 // End angle
									   , r = 1;

								   this.g.lineWidth = this.lineWidth;

								   this.o.cursor
									   && (sat = eat - 0.3)
								   && (eat = eat + 0.3);

								   if( this.o.displayPrevious ){
									   ea = this.startAngle + this.angle( this.v );
									   this.o.cursor
										   && (sa = ea - 0.3)
									   && (ea = ea + 0.3);
									   this.g.beginPath();
									   this.g.strokeStyle = this.pColor;
									   this.g.arc( this.xy, this.xy, this.radius - this.lineWidth, sa, ea, false );
									   this.g.stroke();
								   }

								   this.g.beginPath();
								   this.g.strokeStyle = r ? this.o.fgColor : this.fgColor;
								   this.g.arc( this.xy, this.xy, this.radius - this.lineWidth, sat, eat, false );
								   this.g.stroke();

								   this.g.lineWidth = 2;
								   this.g.beginPath();
								   this.g.strokeStyle = this.o.fgColor;
								   this.g.arc( this.xy, this.xy,
											   this.radius - this.lineWidth + 1 + this.lineWidth * 2 / 3, 0,
											   2 * Math.PI, false );
								   this.g.stroke();

								   return false;
							   }
						   }
					   } );
});