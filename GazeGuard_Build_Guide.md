

GazeGuard

Complete Step-by-Step Build Guide

From Zero to Working Software — Explained Simply



This document walks you through building GazeGuard from scratch. Every step has a plain-English explanation of what you are doing and why, followed by exact code. You do not need to figure anything out on your own — just follow each step in order.





Overview: What You Will Build in 6 Steps





Months 2-3 (Weeks 9-12) are about calibration polish, testing, packaging, and your project report — all covered at the end of this guide.





What You Are Doing and Why

Before you can build anything, your computer needs the right tools installed. Think of this like setting up a kitchen before you cook — you need the stove, the pans, and the ingredients in place first. You will install Python (your main programming language), Node.js (needed for the UI), VS Code (your code editor), and create the folder structure for the whole project.



### Part A: Install Python

Go to python.org/downloads and download Python 3.10 or newer. During installation, check the box that says 'Add Python to PATH' — this is important, do not skip it. This lets you run Python from any folder on your computer.





### Part B: Install Node.js

Go to nodejs.org and download the LTS version (the one labeled 'Recommended For Most Users'). Node.js is needed to build the Electron desktop app later. After installing, check it works by typing: node --version in your terminal.



### Part C: Install VS Code

Go to code.visualstudio.com and download VS Code. It is free. After installing, open it and install these extensions by clicking the Extensions icon on the left sidebar and searching for each one:

Python — by Microsoft

ESLint — for JavaScript code quality

Prettier — auto-formats your code

Pylance — gives Python code suggestions



### Part D: Create Your Project Folder Structure

Open your terminal and run these commands one by one. Each command creates a folder.





Your folder structure should now look like this:





### Part E: Install All Python Libraries

Open your terminal, navigate into the backend folder, and install all the Python libraries you need in one command:







### Part F: Set Up the Electron + React Frontend

Navigate to the frontend folder and create the Electron app:











What You Are Doing and Why

This is the foundation of the entire project. Everything else depends on this working correctly. You are going to open your webcam, use a library called MediaPipe to find 468 points on the user's face in real time, and then use a mathematical formula to detect when someone blinks deliberately vs just blinking naturally.







Create the File

Inside your backend/ folder, create a new file called gaze_engine.py. Open it in VS Code and type the following code:



### Part 1: Imports and Setup



### Part 2: Define the Eye Landmark Indices

MediaPipe gives you 468 points. You only care about the ones around the eyes. These numbers are fixed — they always refer to the same points on the face.





### Part 3: The EAR Calculation Function

This function takes 6 eye landmark points and returns a single number representing how open the eye is.







### Part 4: Blink State Tracker

This tracks the blink state across multiple frames so we can tell the difference between a quick natural blink and a deliberate slow blink.





### Part 5: The Main Webcam Loop

This is the part that actually opens your webcam and runs everything in a loop, processing one frame at a time.





To run this file, open your terminal, go to the backend/ folder, and type:









What You Are Doing and Why

Right now you can detect blinks but you do not know WHERE on the screen the user is looking. This step fixes that. You will build a calibration process where the user looks at 9 dots on the screen, collect data from their eyes while they look at each dot, and train a simple ML model that maps 'eye position' to 'screen position'.







### Part A: Get the Iris Position from MediaPipe

Add this function to your gaze_engine.py file. It extracts the centre of each iris from the 4 iris landmark points.





### Part B: The Calibration Process

Create a new file called calibration.py in your backend/ folder. This file shows the user the 9 dots one by one and collects their gaze data.





Run the calibration:





### Part C: Load Model and Predict Gaze in Real Time

Add this to gaze_engine.py to use the saved model for live prediction:









What You Are Doing and Why

Right now the predicted gaze position jumps around a lot because our eyes naturally make tiny rapid movements called 'microsaccades' — small unconscious eye twitches that happen dozens of times per second. If you move your cursor to the raw predicted position, it will shake and jitter badly and be impossible to use. You need to smooth it.





Add the Smoother to gaze_engine.py



Update the Main Loop to Use Everything Together

Now combine blink detection + gaze prediction + smoothing into one unified loop. This is the final version of your backend gaze engine. Replace the run_tracker() function with this:









What You Are Doing and Why

Now you build what the patient actually sees and uses. The UI has three parts: a Quick Phrases panel (pre-set sentences they can speak with one gaze-and-blink), a Virtual Keyboard (to type any message), and a permanent HELP button. The gaze cursor from your Python backend will move around this UI and the patient selects things by dwelling (looking at something for 1.5 seconds) or blinking.



### Part A: Connect React to the Python WebSocket

Open the frontend/src/ folder. Create a new file called useGaze.js — this is a React hook (a reusable piece of logic) that handles the WebSocket connection.





### Part B: The Gaze Cursor Component

Create GazeCursor.jsx — this is the dot that follows the user's eyes around the screen.





### Part C: The Dwell Button (The Core Interaction)

This is the most important component. Every button on the UI uses dwell to select — the user looks at it for 1.5 seconds and a progress ring fills up. When the ring completes, the button triggers.





### Part D: The Quick Phrases Panel

Create QuickPhrases.jsx — the grid of pre-set phrases the patient can select instantly.





### Part E: The Main App with TTS

Update frontend/src/App.jsx to wire everything together with text-to-speech:





To run the frontend in development mode:







What You Are Doing and Why

The HELP button already exists in the UI. Now you build the backend that actually sends a WhatsApp message (and SMS backup) to the caregiver's phone when that button is triggered. You will use Twilio — a cloud communications service with a generous free tier.



### Part A: Set Up Twilio

Go to twilio.com and create a free account

After signing up, go to your Console Dashboard. Note down your Account SID and Auth Token — you will need these in the code

In the left menu, go to Messaging > Try it out > Send a WhatsApp message

Follow the sandbox setup — you will send 'join [word]' to a Twilio number from the caregiver's phone to enable WhatsApp for that number

Note the sandbox WhatsApp number (looks like +1-415-523-8886)





### Part B: Create the Alert Backend

Create a new file called alert_service.py in your backend/ folder:





Run the alert server in a new terminal window:







Month 3: Polish, Testing & Final Packaging





## Week 9: Polish the Calibration UI

The calibration process currently runs in an OpenCV window which looks technical and intimidating for caregivers. Build a proper calibration screen inside your React app:

Show a large friendly message: 'Look at each green dot as it appears. Hold your gaze steady on each dot.'

Show dots one at a time with a 2-second countdown timer before each one

Add a progress bar at the top showing 'Dot 3 of 9'

After calibration, show: 'All done! GazeGuard is ready to use.'

Save the calibration profile with the patient's name so multiple patients can use the same device



## Week 10: Testing Checklist

Test your full system systematically with real people before your presentation. Here is what to test:





## Week 11: Write Your Project Report

Your report should have these sections in this order. Aim for 25-30 pages minimum:



Abstract (one page) — summarize the problem, your solution, and key results

Introduction — explain ALS, the communication challenge, cost of existing solutions, your research gap

Literature Review — describe 5-6 existing tools (Tobii, eViacam, OpenGazer) and explain what each one lacks

System Design — your three-module architecture, draw a proper diagram using draw.io (free at draw.io)

Implementation — explain the EAR algorithm, ridge regression, EMA smoother, dwell detection with equations

Evaluation — tables showing gaze accuracy (pixels), blink accuracy (%), latency (ms), CPU usage (%)

Results and Discussion — compare your results to existing tools, explain any limitations

Conclusion and Future Work — summarize contribution, suggest 3 future extensions

References — cite MediaPipe paper, EAR paper (Soukupova & Cech 2016), and any datasets used



## Week 12: Package the App

Turn your development setup into a single installable application that any caregiver can install without knowing Python or Node.js:







Presentation Tips — The Final 15 Minutes That Determine Your GPA





Structure your 15-minute presentation slot like this:

2 minutes — Show a photo of an ALS patient. State the problem in one sentence: 'This person cannot move or speak. The only tool that could let them communicate costs 8 lakh rupees. GazeGuard does the same for zero rupees.'

1 minute — Show the architecture slide. Just three boxes: Gaze Engine, Communication Board, Alert System.

8 minutes — Live demo. Follow the exact sequence in your guide: calibrate, select phrase, type on keyboard, trigger HELP alert. Have your phone visible so evaluators see the WhatsApp arrive.

2 minutes — Show your results table: gaze accuracy, blink accuracy, latency, CPU usage.

2 minutes — Future scope. Mobile version, more languages, wheelchair integration.







GazeGuard Complete Build Guide — Good luck, Dipto!