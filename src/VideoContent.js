import React from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import YouTube from 'react-youtube';
import ReactFireMixin from 'reactfire';
import firebase from 'firebase';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import {List, ListItem} from 'material-ui/List';
import {grey400, darkBlack, lightBlack} from 'material-ui/styles/colors';

const ChatMessage = ({ time, name, message, photoUrl}) => {
    var timestamp = new Date(time);
    var secondaryText = <p><span style={{ color: darkBlack }}>{timestamp.toDateString() }</span> by {name}</p>;
    var avatar = <Avatar src={photoUrl} />;
    return (
        <div>
            <ListItem leftAvatar={avatar} primaryText={message} secondaryText={secondaryText}/>
            <Divider inset={true} />
        </div>
    );
};

const VideoContent = React.createClass({
    mixins: [ReactFireMixin],

    contextTypes: {
        router: React.PropTypes.object.isRequired
    },

    getInitialState() {
        var user = firebase.auth().currentUser;
        return {
            videoYouTubeId: '',
            author: '',
            photoUrl: '',
            description: '',
            messages: [],
            open: false,
            chatRef: firebase.database().ref(`/${this.props.collection}/${this.props.videoKey}/chat`),
            friendsRef: firebase.database().ref(`/users/${user.uid}`).child('friends')
        };
    },

    componentDidMount() {
        const videoRef = firebase.database().ref(`/${this.props.collection}/${this.props.videoKey}`);
        videoRef.once('value', snapshot => {
            const s = snapshot.val();
            this.setState(s);
        });
        this.bindAsArray(this.state.chatRef.orderByChild('time').limitToFirst(100), 'messages');
    },

    postMessage() {
        this.state.chatRef.push({
            time: firebase.database.ServerValue.TIMESTAMP,
            message: this.refs.messageText.getValue(),
            name: this.state.author,
            photoUrl: this.state.photoUrl,
        });
        this.setState({ message: '', open: true });
    },

    repostVideo() {
      var videoId = this.props.videoKey;
      this.state.friendsRef.once('value', s => {
        s.val().map(e => Object.keys(e)[0]).forEach(id => {
          var friendRef = firebase.database().ref(`/users/${id}`).child('videos')
          friendRef.push({id: videoId});
        })
      })
    },

    render() {
        var messages = this.state.messages.slice(0).reverse();
        return (
            <Card>
                <CardHeader
                    title={this.state.author}
                    subtitle={this.state.description}
                    avatar={this.state.photoUrl}
                    />
                <CardMedia>
                    {
                        this.state.videoYouTubeId ? <YouTube
                            videoId={this.state.videoYouTubeId}
                            opts={this.props.opts}
                            onReady={this.props.onReady}
                            onStateChange={this.props.onStateChange}
                            /> : null
                    }
                </CardMedia>
                <CardTitle title="Comment" subtitle="What do you think about this video?" />
                <CardText>
                    <TextField hintText="Your comment" ref="messageText"/>
                </CardText>
                <CardActions>
                    <FlatButton onClick={this.postMessage} label="Add" />
                    <FlatButton onClick={this.repostVideo} label="Repost" />
                    {this.props.children}
                </CardActions>
                <List style={{ maxHeight: 300, overflow: 'scroll' }}>
                    {messages.map((message, index) => <ChatMessage key={index} {...message} />) }
                </List>
            </Card>
        )
    }
})

export default VideoContent;