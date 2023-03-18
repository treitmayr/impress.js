/**
 * Substep Plugin
 *
 * Copyright 2017 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */

/* global document, window */

( function( document, window ) {
    "use strict";

    // Copied from core impress.js. Good candidate for moving to src/lib/util.js.
    var triggerEvent = function( el, eventName, detail ) {
        var event = document.createEvent( "CustomEvent" );
        event.initCustomEvent( eventName, true, true, detail );
        el.dispatchEvent( event );
    };

    var activeStep = null;

    var stepenterHandler = function( event ) {
        var step = event.target;

        // The only relevant case where the preStepLeave callback is not invoked
        // is a "goto" event (e.g. on reload), therefore handle it here.
        if ( event.detail.reason === "goto" && !event.detail.next && !event.detail.prev ) {
            activeStep = step;

            // Reset the step
            resetAllSubsteps( step, false );

            if ( "substepActive" in step.dataset ) {
                var el = showSubstepIfAny( step );
                if ( el ) {
                    triggerEvent( step, "impress:substep:enter",
                                  { reason: "next", substep: el } );
                }
            }
        }
    };
    document.addEventListener( "impress:stepenter", stepenterHandler, false );

    var substep = function( event ) {
        if ( ( !event ) || ( !event.target ) ) {
            return;
        }

        var step = event.target;
        var nextStep = event.detail.next;
        var abortEvent = false;

        var el;
        if ( event.detail.reason === "next" ) {
            el = showSubstepIfAny( step );
            if ( el ) {
                abortEvent = true;
            } else {
                resetAllSubsteps( nextStep, false );

                // If requested via "data-substep-active" attribute, active the
                // first substep(s) immediately
                if ( "substepActive" in nextStep.dataset ) {
                    el = showSubstepIfAny( nextStep );
                    if ( el ) {
                        triggerEvent( nextStep, "impress:substep:enter",
                                      { reason: "next", substep: el } );
                    }
                }
            }

        } else if ( event.detail.reason === "prev" ) {
            el = hideSubstepIfAny( step );
            if ( el ) {
                abortEvent = true;
            } else {

                // Consider the option data-substep-prev-mode="restart|rewind"
                if ( ( "substepPrevMode" in nextStep.dataset ) &&
                     ( nextStep.dataset.substepPrevMode === "restart" ) ) {
                    restartStep( nextStep );
                } else {
                    rewindStep( nextStep );
                }
            }

        } else if ( event.detail.reason === "goto" ) {
            resetAllSubsteps( step, true );

            // Prepare next step
            var newEvent = { target: nextStep, detail: { reason: event.detail.reason } };
            stepenterHandler( newEvent );
            return;
        }

        if ( abortEvent )
        {
            activeStep = step;
            var detail = { reason: event.detail.reason, substep: el };
            triggerEvent( step, "impress:substep:stepleaveaborted", detail );
            triggerEvent( step, "impress:substep:leave", detail );
            return false;
        } else {
            activeStep = nextStep;
        }
    };

    var restartStep = function( step ) {

        // Make all substeps invisible
        resetAllSubsteps( step, false );

        // If requested via "data-substep-active" attribute, active the
        // first substep(s) immediately
        if ( "substepActive" in step.dataset ) {
            var el = showSubstepIfAny( step );
            if ( el ) {
                triggerEvent( step, "impress:substep:enter",
                              { reason: "next", substep: el } );
            }
        }
    };

    var rewindStep = function( step ) {

        // Make all substeps visible, activate the last one
        resetAllSubsteps( step, true );
        hideSubstepIfAny( step );
    };

    var resetAllSubsteps = function( step, makeVisible ) {
        var i;
        var substeps;
        if ( makeVisible ) {
            substeps = step.querySelectorAll( ".substep" );
            if ( substeps.length > 0 ) {
                for ( i = 0; i < substeps.length; i++ ) {
                    substeps[ i ].classList.remove( "substep-active" );
                    substeps[ i ].classList.add( "substep-visible" );
                }
            }
         } else {
            substeps = step.querySelectorAll( ".substep-active, .substep-visible" );
            if ( substeps.length > 0 ) {
                for ( i = 0; i < substeps.length; i++ ) {
                    substeps[ i ].classList.remove( "substep-active", "substep-visible" );
                }
            }
        }
    };

    var showSubstepIfAny = function( step ) {
        var substeps = step.querySelectorAll( ".substep" );
        if ( substeps.length > 0 ) {
            var sorted = sortSubsteps( substeps );
            var visible = step.querySelectorAll( ".substep-visible" );
            return showSubstep( sorted, visible );
        }
    };

    var sortSubsteps = function( substepNodeList ) {
        var substeps = Array.from( substepNodeList );
        var sorted = substeps
            .filter( el => el.dataset.substepOrder )
            .sort( ( a, b ) => {
                var orderA = a.dataset.substepOrder;
                var orderB = b.dataset.substepOrder;
                return parseInt( orderA ) - parseInt( orderB );
            } )
            .concat( substeps.filter( el => {
                return el.dataset.substepOrder === undefined;
            } ) );
        return sorted;
    };

    var showSubstep = function( substeps, visible ) {
        var i;
        for ( i = 0; i < substeps.length; i++ ) {
            substeps[ i ].classList.remove( "substep-active" );
        }
        if ( visible.length < substeps.length ) {
            var el = substeps[ visible.length ];
            el.classList.add( "substep-visible", "substep-active" );

            // Continue if there is another substep with the same substepOrder
            if ( visible.length + 1 < substeps.length ) {
                var referenceOrder = el.dataset.substepOrder;
                if ( referenceOrder !== undefined ) {
                    for ( i = visible.length + 1; i < substeps.length; i++ ) {
                        el = substeps[ i ];
                        if ( el.dataset.substepOrder === referenceOrder ) {
                            el.classList.add( "substep-visible", "substep-active" );
                        } else {
                            break;
                        }
                    }
                }
            }

            return el;
        }
    };

    var hideSubstepIfAny = function( step ) {
        var substeps = step.querySelectorAll( ".substep" );
        if ( substeps.length > 0 ) {
            var visible = step.querySelectorAll( ".substep-visible" );
            var sorted = sortSubsteps( visible );
            return hideSubstep( step, sorted );
        }
    };

    var hideSubstep = function( step, visible ) {
        if ( visible.length > 0 ) {
            var firstActive = -1;
            var i;
            var el;

            // Find the first active substep and inactivate all active substeps
            for ( i = 0; i < visible.length; i++ ) {
                if ( visible[ i ].classList.contains( "substep-active" ) ) {
                    if ( firstActive < 0 ) {
                        firstActive = i;
                    }
                    el = visible[ i ];
                    el.classList.remove( "substep-active", "substep-visible" );
                }
            }

            if ( firstActive < 0 ) {

                // There was no active substep, so just prepare for
                // marking the last substep(s) as active
                firstActive = visible.length;
            }

            if ( firstActive > 0 ) {
                var newActiveSubstep = visible[ firstActive - 1 ];
                newActiveSubstep.classList.add( "substep-active" );

                // Continue if there is another substep with the same substepOrder
                var referenceOrder = newActiveSubstep.dataset.substepOrder;
                if ( referenceOrder !== undefined ) {
                    for ( i = firstActive - 1; i >= 0; i-- ) {
                        if ( visible[ i ].dataset.substepOrder === referenceOrder ) {
                            visible[ i ].classList.add( "substep-active" );
                        } else {
                            break;
                        }
                    }
                }
            } else if ( "substepActive" in step.dataset ) {

                // First substep is active
                el = undefined;
            }

            // Return the top-most substep to be consistent with the showSubstep() result.
            return el;
        }
    };

    // Register the plugin to be called in pre-stepleave phase.
    // The weight makes this plugin run before other preStepLeave plugins.
    window.impress.addPreStepLeavePlugin( substep, 1 );

    // API for others to reveal/hide next substep ////////////////////////////////////////////////
    document.addEventListener( "impress:substep:show", function() {
        showSubstepIfAny( activeStep );
    }, false );

    document.addEventListener( "impress:substep:hide", function() {
        hideSubstepIfAny( activeStep );
    }, false );

} )( document, window );
