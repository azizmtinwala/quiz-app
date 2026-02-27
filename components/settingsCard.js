import Airtable from "airtable";
import {Card, Radio} from "antd";
import {useState, useEffect} from "react";
import {firestore} from "../firebase/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

var quizAirtableBase = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
}).base("apptEF5Ojk1J09sel");

const quizBase = quizAirtableBase("Quiz");

export const QuizSettingsCard = () => {
  const [settings, setSettings] = useState({});
  const [isQuizLive, setisQuizLive] = useState(false);
  const [showQuizAnswers, setshowQuizAnswers] = useState(false);

  useEffect(() => {
    getAdminSettings();
  }, []);

  const getAdminSettings = async () => {
    const querySnapshot = await getDocs(collection(firestore, "quiz_settings"));
    querySnapshot.forEach((doc) => {
      setSettings({
        id: doc.id,
        ...doc.data(),
      });
      setisQuizLive(doc.data().is_quiz_live);
      setshowQuizAnswers(doc.data().show_answers);
    });
  };

  const handleIsQuizLiveChange = async (val) => {
    await updateDoc(doc(firestore, "quiz_settings", settings.id), {
      is_quiz_live: val.target.value,
    });
    await getAdminSettings();
  };

  const handleShowAnswersChange = async (val) => {
    await updateDoc(doc(firestore, "quiz_settings", settings.id), {
      show_answers: val.target.value,
    });
    await getAdminSettings();
  };

  const uploadQuizQuestions = async () => {
    const finalData = [];
    const questions_id = [];

    const querySnapshot = await getDocs(
      collection(firestore, "quiz_questions")
    );
    querySnapshot.forEach((doc) => {
      questions_id.push(doc.id);
    });

    await questions_id.map(async (val) => {
      await deleteDoc(doc(firestore, "quiz_questions", val));
    });

    await quizBase
      .select({
        maxRecords: 1200,
        view: "Grid view",
        pageSize: 100,
      })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(function (record) {
            finalData.push(record);
          });

          fetchNextPage();
        },
        async function done(err) {
          await finalData.map(async (val) => {
            await setDoc(
              doc(firestore, "quiz_questions", val.fields.question_id),
              {...val.fields}
            );
          });
          if (err) {
            console.error(err);
            return;
          }
        }
      );
  };

  return (
    <Card className="border-radius-10" title="Quiz Settings">
      <div className="flex items-center justify-center mb-4">
        <span className="flex-1">Is Quiz Live</span>
        <Radio.Group onChange={handleIsQuizLiveChange} value={isQuizLive}>
          <Radio value={true}>Yes</Radio>
          <Radio value={false}>No</Radio>
        </Radio.Group>
      </div>
      <div className="flex items-center justify-center mb-4">
        <span className="flex-1">Show Answers</span>
        <Radio.Group onChange={handleShowAnswersChange} value={showQuizAnswers}>
          <Radio value={true}>Yes</Radio>
          <Radio value={false}>No</Radio>
        </Radio.Group>
      </div>

      <div className="flex items-center justify-center mb-4">
        <span className="flex-1">Sync Questions </span>
        <button
          onClick={uploadQuizQuestions}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-0 px-4 border border-blue-700 rounded h-10 flex items-center justify-center"
        >
          <span>Upload</span>
        </button>
      </div>
    </Card>
  );
};
