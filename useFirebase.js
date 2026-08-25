import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { eventsData as fallbackEvents } from "../data/eventsData";
import { projectsData as fallbackProjects } from "../data/projectsData";
import { 
  facultyCoordinator as fallbackFaculty, 
  executiveCommittee as fallbackExec, 
  officeBearers as fallbackOffice, 
  committeeMembers as fallbackCommittee 
} from "../data/teamData";
import { Cpu, Radio, Wifi, Zap, Globe, Github } from "lucide-react";

const iconMap = {
  Cpu,
  Radio,
  Wifi,
  Zap,
  Globe,
  Github
};

export const useFirebaseData = () => {
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState({
    facultyCoordinator: fallbackFaculty,
    executiveCommittee: fallbackExec,
    officeBearers: fallbackOffice,
    committeeMembers: fallbackCommittee,
    allYears: ["2025-2026"],
    currentYear: "2025-2026"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Events
        const eventsRef = collection(db, "events");
        const eventsSnapshot = await getDocs(eventsRef);
        let fetchedEvents = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (fetchedEvents.length === 0) {
          fetchedEvents = fallbackEvents;
        }

        // Fetch Projects
        const projectsRef = collection(db, "projects");
        const projectsSnapshot = await getDocs(projectsRef);
        let fetchedProjects = projectsSnapshot.docs.map(doc => {
          const data = doc.data();
          const IconComp = iconMap[data.icon] || Cpu;
          return {
            id: doc.id,
            ...data,
            icon: IconComp,
            iconName: data.icon
          };
        });

        if (fetchedProjects.length === 0) {
          fetchedProjects = fallbackProjects;
        }

        // Fetch Settings
        let currentYearSetting = "2025-2026";
        try {
          const settingsSnap = await getDoc(doc(db, "settings", "execom_config"));
          if (settingsSnap.exists()) {
            currentYearSetting = settingsSnap.data().currentYear || "2025-2026";
          }
        } catch (err) {
          console.warn("Failed to fetch settings, using default active term", err);
        }

        // Fetch Team Members
        const teamRef = collection(db, "team");
        const teamSnapshot = await getDocs(teamRef);
        let fetchedTeam = teamSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        let processedTeam = {
          facultyCoordinator: fallbackFaculty,
          executiveCommittee: fallbackExec,
          officeBearers: fallbackOffice,
          committeeMembers: fallbackCommittee,
          allYears: ["2025-2026"],
          currentYear: currentYearSetting
        };

        if (fetchedTeam.length > 0) {
          // Sort by order
          fetchedTeam.sort((a, b) => (a.order || 0) - (b.order || 0));

          // Extract all unique committeeYears
          const years = [...new Set(fetchedTeam.map(m => m.committeeYear).filter(Boolean))];
          if (!years.includes(currentYearSetting)) {
            years.push(currentYearSetting);
          }
          years.sort().reverse(); // Sort years descending

          // Group by category for the selected current active year
          const membersForYear = fetchedTeam.filter(m => m.committeeYear === currentYearSetting);

          processedTeam = {
            facultyCoordinator: membersForYear.find(m => m.category === "Faculty Coordinator") || fallbackFaculty,
            executiveCommittee: membersForYear.filter(m => m.category === "Executive Committee"),
            officeBearers: membersForYear.filter(m => m.category === "Office Bearers"),
            committeeMembers: membersForYear.filter(m => m.category === "Committee Members"),
            allYears: years,
            currentYear: currentYearSetting,
            rawMembers: fetchedTeam
          };

          // Fallbacks for empty categories
          if (processedTeam.executiveCommittee.length === 0 && currentYearSetting === "2025-2026") {
            processedTeam.executiveCommittee = fallbackExec;
          }
          if (processedTeam.officeBearers.length === 0 && currentYearSetting === "2025-2026") {
            processedTeam.officeBearers = fallbackOffice;
          }
          if (processedTeam.committeeMembers.length === 0 && currentYearSetting === "2025-2026") {
            processedTeam.committeeMembers = fallbackCommittee;
          }
        }

        setEvents(fetchedEvents);
        setProjects(fetchedProjects);
        setTeam(processedTeam);
      } catch (err) {
        console.warn("Failed to fetch data from Firebase. Using local fallbacks.", err);
        setEvents(fallbackEvents);
        setProjects(fallbackProjects);
        setTeam({
          facultyCoordinator: fallbackFaculty,
          executiveCommittee: fallbackExec,
          officeBearers: fallbackOffice,
          committeeMembers: fallbackCommittee,
          allYears: ["2025-2026"],
          currentYear: "2025-2026"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { events, projects, team, loading };
};'
