import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { getAcademicYear } from "../utils/academicYear";

const COLLECTION = "achievements";

export const CATEGORIES = [
  "publication",
  "certification",
  "internship",
  "workshop",
  "hackathon",
  "patent",
  "sports",
  "cultural",
  "other",
];

export async function submitAchievement(user, formData) {
  return addDoc(collection(db, COLLECTION), {
    ...formData,
    academicYear: getAcademicYear(formData.dateOfActivity),
    submittedBy: user.uid,
    submittedByName: user.name,
    role: user.role,
    department: user.department,
    status: "pending",
    reviewedBy: null,
    reviewComment: "",
    createdAt: serverTimestamp(),
  });
}

export async function getMyAchievements(uid) {
  const q = query(
    collection(db, COLLECTION),
    where("submittedBy", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getFilteredAchievements({
  status,
  category,
  department,
  role,
  academicYear,
} = {}) {
  const conditions = [];
  if (status) conditions.push(where("status", "==", status));
  if (category) conditions.push(where("category", "==", category));
  if (department) conditions.push(where("department", "==", department));
  if (role) conditions.push(where("role", "==", role));
  if (academicYear) conditions.push(where("academicYear", "==", academicYear));
  conditions.push(orderBy("createdAt", "desc"));

  const q = query(collection(db, COLLECTION), ...conditions);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function reviewAchievement(id, status, reviewComment, adminUid) {
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    reviewComment: reviewComment || "",
    reviewedBy: adminUid,
  });
}

export async function getAnalytics() {
  const base = collection(db, COLLECTION);

  const statusKeys = ["pending", "approved", "rejected"];
  const statusCounts = await Promise.all(
    statusKeys.map((s) => getCountFromServer(query(base, where("status", "==", s))))
  );

  const categoryCounts = await Promise.all(
    CATEGORIES.map((c) => getCountFromServer(query(base, where("category", "==", c))))
  );

  const totalSnap = await getCountFromServer(base);

  return {
    total: totalSnap.data().count,
    byStatus: statusKeys.map((s, i) => ({ name: s, count: statusCounts[i].data().count })),
    byCategory: CATEGORIES.map((c, i) => ({ name: c, count: categoryCounts[i].data().count })).filter(
      (c) => c.count > 0
    ),
  };
}