import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, SafeAreaView, Alert } from 'react-native';
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import messaging from '@react-native-firebase/messaging'
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'

TaskManager.defineTask('task', async () => {
  const now = Date.now();

  console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);

  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
})

async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync('task', {
    minimumInterval: 60 * 15, // 15 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync('task');
}

async function requestUserPermission() {
	const authStatus = await messaging().requestPermission()
	const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
	authStatus === messaging.AuthorizationStatus.PROVISIONAL

	if (enabled) {
		console.log('Authorization status:', authStatus)
		}
}

messaging().setBackgroundMessageHandler(async remoteMessage => {
	console.log('Message handled in the background!', remoteMessage)
	})

const doc = firestore().collection('stuff').doc('Hello')

export default function App() {
  const [status, setStatus] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    requestUserPermission()
    doc.get().then(snapshot => {
      console.log('snapshot exists?', snapshot.exists)
    })
    messaging().getToken().then(token => console.log('registered with', token))
    checkStatusAsync()
  }, [])

  useEffect(() => {
    const unsubscribe = messaging().onMessage(message => {
      console.log('thats can be a new sms code', message)
    })

    return unsubscribe
  })

  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync('task');
    setStatus(status);
    setIsRegistered(isRegistered);
    console.log('background status', status, 'is registered', isRegistered)
    if (!isRegistered) registerBackgroundFetchAsync()
  };

  const [confirm, setConfirm] = useState(null)
  const [code, setCode] = useState('')
  
  if (!confirm) 
    return <SafeAreaView style={{flex: 1, justifyContent: 'center'}}>
      <Button title="Phone Number Sign In" onPress={async () => {
        try {
          console.log('attempt to sign in')
          // auth().settings.appVerificationDisabledForTesting = true
          await auth().settings.setAutoRetrievedSmsCodeForPhoneNumber('+10000000002', '123456')
        const confirmation = await auth().signInWithPhoneNumber("+10000000002")
        console.log('created confirmation', confirmation.verificationId)
        console.log('confirmation code?', confirmation.code)
        setConfirm(confirmation)
        } catch (e) {
          console.log('failed to sign in', e)
        }
      }} />
    </SafeAreaView>

  return (
    <SafeAreaView>
      <TextInput value={code} onChangeText={text => setCode(text)} />
      <Button title="Confirm Code" onPress={async () => {
        try {
        await confirm.confirm(code)
        Alert.alert('Authenticated')
        } catch (e) {
          console.log('confirmation failed', e)
        }
      }} />
    </SafeAreaView>
  );
}
