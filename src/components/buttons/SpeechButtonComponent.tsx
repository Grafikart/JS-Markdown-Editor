import {h} from 'preact'
import {Button} from './ButtonComponent'

interface IState {
  listening: boolean
}

export default class Speech extends Button<IState> {

  private recognition: SpeechRecognition
  private capitalize: boolean

  constructor (props: {editor: CodeMirror.Editor}) {
    super(props)
    if (window.hasOwnProperty('webkitSpeechRecognition')) {
      this.recognition = new webkitSpeechRecognition()
      this.recognition.lang = 'fr-FR'
      this.recognition.continuous = true
      this.recognition.interimResults = true
    }
    this.capitalize = true
    this.state = {
      listening: false
    }
  }

  render () {
    return window.hasOwnProperty('webkitSpeechRecognition') ? super.render() : null
  }

  icon () {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style={this.getStyle()}><path d="M96 256V96c0-53.019 42.981-96 96-96s96 42.981 96 96v160c0 53.019-42.981 96-96 96s-96-42.981-96-96zm252-56h-24c-6.627 0-12 5.373-12 12v42.68c0 66.217-53.082 120.938-119.298 121.318C126.213 376.38 72 322.402 72 256v-44c0-6.627-5.373-12-12-12H36c-6.627 0-12 5.373-12 12v44c0 84.488 62.693 154.597 144 166.278V468h-68c-6.627 0-12 5.373-12 12v20c0 6.627 5.373 12 12 12h184c6.627 0 12-5.373 12-12v-20c0-6.627-5.373-12-12-12h-68v-45.722c81.307-11.681 144-81.79 144-166.278v-44c0-6.627-5.373-12-12-12z"/></svg>
  }

  getStyle (): string {
    if (this.state.listening) {
      return 'fill:#FF0000';
    }
    return ''
  }

  action (editor: CodeMirror.Editor) {
    if (this.state.listening === true) {
      this.recognition.stop()
      this.setState({listening: false})
    } else {
      this.recognition.start()
      this.setState({listening: true})
      this.recognition.onresult = (e) => {
        let result = e.results.item(e.resultIndex)
        if (result.isFinal === true) {
          let transcript = result.item(0).transcript
          if (this.capitalize) {
            transcript = transcript.charAt(0).toUpperCase() + transcript.slice(1)
          }
          this.capitalize = transcript.endsWith('.');
          editor.getDoc().replaceSelection(transcript)
        }
      }
    }
    /*

            if ('webkitSpeechRecognition' in window) {
                $('#btn').click(function(){
                    recognition.start();
                    $('#result').text();
                    $('#btn').removeClass('btn-primary').html('Enregistrement en cours...');
                });
                recognition.onresult = function (event) {
                    $('#result').text('');
                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            recognition.stop();
                            var transcript = event.results[i][0].transcript;
                            var words = transcript.split(' ');
                            if(words[0] == 'chercher'){
                                window.open("https://www.google.com/search?q=" + transcript.replace('chercher', ''),'_blank')
                                return true;
                            }
                            $('#btn').addClass('btn-primary').html('Démarrer l\'enregistrement');
                            $('#result').text(transcript);
                            var path = transcript.split('direction');
                            if(path.length < 2){
                                alert('Demande non reconnu :(');
                                return false;
                            }

                            // La partie google map
                            var request = {
                                origin      : path[0],
                                destination : path[1],
                                travelMode  : google.maps.DirectionsTravelMode.DRIVING
                            }
                            var directionsService = new google.maps.DirectionsService();
                            directionsService.route(request, function(response, status){
                                if(status == google.maps.DirectionsStatus.OK){
                                    direction.setDirections(response);
                                }
                            });
                        }else{
                            $('#result').text($('#result').text() + event.results[i][0].transcript);
                        }
                    }
                };


            }

     */
  }
}
