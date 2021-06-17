import React, { useEffect, useState } from 'react'
import styled from 'styled-components';
import { Playnext, Playprev, togglePlay } from '../utils/controls';
import { Text } from '../styles/Styles';
import {addToPlaylist, checkInPlaylist, removeFromPlaylist} from '../utils/db';
import Back from './Back';
import { share } from '../utils/common';
import { GetLyrics } from '../requests';
import Error404 from './Error404';



function Player() {
  
    const [song, setsong] = useState(JSON.parse(localStorage.getItem('current')))
    const [loading, setloading] = useState(false);
    const [like, setlike] = useState(false);
    const [lyricsloading, setlyricsloading] = useState(true);
    const [lyrics, setlyrics] = useState('')
    
    const [seekerpos, setseekerpos] = useState(localStorage.getItem('currentTime') || 0);
    const audio=document.getElementById('player');
    
    

    
    useEffect(() => {  // geet lyrics of song 
      async function  get(){
        setlyricsloading(true);
        const res=await GetLyrics(song?song.id:'');
        if(res.data && res.data.lyrics){
          setlyrics(res.data.lyrics);
          document.body.scrollTop = 0;
          
        // This is needed if the user scrolls down during page load and you want to make sure the page is scrolled to the top once it's fully loaded. This has Cross-browser support.
        window.scrollTo(0,0);
        }
        else{
          setlyrics('No Lyrics Found')
        }
        setlyricsloading(false);

        
      }
      
      get();
      return () => {
        
      }
    }, [song])


    async function onlikecliked(){
          if(like){
            await removeFromPlaylist(song.id);
          }
          else{
             addToPlaylist(song);
          }
          setlike(!like);
    } 


    useEffect(() => {
      
     
      

      async function get(){
        const r=await checkInPlaylist(song?song.id:'');
        if(r){
          setlike(true);
        }
        else{
          setlike(false);
        }
      }
      const newdata=JSON.parse(localStorage.getItem('current'));
      if(newdata && newdata.id!==song.id ){  //update only when song changes
        setsong(newdata);
        
      }
      get();

      
      return () => {
        
      }
    }, [loading]);

     function checkbuffer(){



     let slowInternetTimeout = null;

     const  onwaiting=()=>{

      slowInternetTimeout = setTimeout(() => {
        setloading(true);
        });
     }

      const onplaying=()=>{
    if(slowInternetTimeout != null){
      clearTimeout(slowInternetTimeout);
      slowInternetTimeout = null;
      //continue playing
      setloading(false);
      audio.play();
      }
      
 

      }
         
          audio.addEventListener('waiting',onwaiting);

          audio.addEventListener('playing', onplaying);

     }


    useEffect(() => {
        
        const seeker=document.getElementById('seeker');
        if(seeker){
          seeker.max=audio.duration;
          seeker.oninput=(e)=>{
            
            audio.currentTime=e.target.value;
            setseekerpos(e.target.value);
          }
        }
        
        if(audio.paused){
          audio.currentTime=seekerpos;
        }
        

        checkbuffer();

        



        function onaudiotimeupdate(){

          seeker.max=audio.duration;
          setseekerpos(audio.currentTime)
           
          document.getElementById('start').innerHTML=new Date(audio.currentTime*1000).toISOString().substr(14, 5)
        
          document.getElementById('end').innerHTML=new Date(audio.duration?audio.duration*1000:237*1000).toISOString().substr(14, 5)
       
    
        }

       
        
        const onsongended=()=>{
          Playnext(setloading)
        }
        
        audio.addEventListener("timeupdate",onaudiotimeupdate);
        audio.addEventListener("ended",onsongended);

       return () => {
         audio.removeEventListener("timeupdate",onaudiotimeupdate);
         audio.removeEventListener("waiting",onwaiting);
         audio.removeEventListener("playing",onplaying);
         audio.removeEventListener("ended",onsongended)

            
        }

    }, [])

    if(song==undefined){
      return <Error404/>
    }
    return (
        <Wrapper>
            
            <Back/>
            <HeaderWrapper>

            
            <Text color="white" family="Poppins" size="1.2em"  bold={600}>Now Playing</Text>
            
            </HeaderWrapper>
            
           <ImageWrapper>
                   
                   <Image src={song.image} width="280px" height="280px"/>
                   
                   
           </ImageWrapper>
           
            
            
           <LyricsWrapper>
             {
               lyricsloading?
               <center><Text color="white" family="Poppins" size="0.9em" >Loading... lyrics</Text></center>
               :
               lyrics.split('<br>').map((line)=>{
                       return <LyricsText color="white" family="Poppins" size="0.9em">{line}</LyricsText>
               })
               
               
             }

            
            
            </LyricsWrapper>
            
            
            <Footer>
            <Text color="white" family="Poppins" size="1.2em" padding="0 0 0 20px">{song.title}</Text>
            
            <Text color="gray" family="Poppins" size="0.9em" padding="0 0 0 20px">{song.description}</Text>
            <ProgressBarWrapper>
                <ProgressBar id="seeker" type="range" value={seekerpos} max="0"/>
                <Timer>
                <Text color="gray" family="Poppins" size="0.9em" padding="0 0 0 0" id="start">00:00</Text>
                <Text color="gray" family="Poppins" size="0.9em" padding="0 0 0 20px" id="end">NaN</Text>
                </Timer>
            </ProgressBarWrapper>

            

            
            <ToolBar>
                <Icon color={like?"red":"white"} size="1.8em" onClick={onlikecliked}><i class="fa fa-heart"></i></Icon>
                <Icon color="white" size="1.8em" onClick={()=>Playprev(setloading)}><i class="fa fa-chevron-circle-left"></i></Icon>
                {
                  loading?<div className="loader" style={{margin:"5px"}}></div>:
                  <Icon color="white" size="2.3em" onClick={togglePlay}><i class={audio.paused?"fa fa-play":"fa fa-pause"} id="toggleplay"></i></Icon>

                }
                <Icon color="white" size="1.8em" onClick={()=>Playnext(setloading)}><i class="fa fa-chevron-circle-right"></i></Icon>
                <Icon color="white" size="1.8em" onClick={()=>share({title:song.title,url:song.share_url,text:song.title})}><i class="fa fa-share-alt"></i></Icon>

            </ToolBar>
            </Footer>
            
        </Wrapper>
    )
}

export default Player


const Wrapper=styled.div`

width:100vw;
`

const LyricsWrapper=styled.div`
padding-top:20px;
padding-left:15px;
padding-right:15px;
padding-bottom:200px;
text-align:center;
font-style:italic;

`

const HeaderWrapper=styled.div`
display:flex;
justify-content:space-around;
padding:20px;

`
const Footer=styled.div`
position:fixed;
bottom:0px;
width:100vw;
padding-bottom:10px;
background:#2a2d36;

`
const Timer=styled.div`
display:flex;
justify-content:space-between;
`
const ImageWrapper=styled.div`
display:flex;
width:100%;
justify-content:center;
align-items:center;
padding-top:3vh;
height:100%;

`
const ProgressBarWrapper=styled.div`
padding:10px;

`
const ProgressBar=styled.input`

width:100%;
height:5px;
fill:white;
appearance:none;
background-color: white;
box-shadow: none;
border-radius:10px;


&::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: cyan;
    cursor:pointer;
  };

&::-webkit-slider-runnable-track {
    height: 10px;
    -webkit-appearance: none;
    color: green;
    margin-top: -1px;
  };
&::-ms-fill-upper {  
    background-color: green;
  };
&::-moz-range-track {  
    background-color: green;
  };

&::-moz-range-progress {
    background-color: green; 
  }


`

const LyricsText=styled.div`

padding:5px;
color:${props=>props.color || 'red'};
font-family:${props=>props.family || 'mono'};
font-size:${props=>props.size || "10px"};
font-weight:${props=>props.bold};

`

const Icon=styled.a`
color:${props=>props.color};
font-size:${props=>props.size};


`
const ToolBar=styled.div`
display:flex;
padding:20px;
justify-content:space-around;
align-items:center;

`
const Image=styled.img`
border-radius:30px;
box-shadow:0px 0px 40px  gray;
// animation:disc 8s infinite linear;
`


