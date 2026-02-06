import React from "react";
import { motion } from "framer-motion";
import { Edit3 } from "lucide-react";
import { usePlanner } from "../../contexts/PlannerContext";

export const PlannerReEditModal: React.FC = () => {
    const {
        isReEditModalOpen,
        setIsReEditModalOpen,
        tripToEdit,
        setPlannerData,
        setDynamicAttractions,
        setSelectedPlaceIds,
        setAttractionCategoryFilter,
        fetchAttractionsWithAI,
        setIsPlanning,
        setPlannerStep
    } = usePlanner();

    if (!isReEditModalOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(10px)",
                zIndex: 9000000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    width: "100%",
                    maxWidth: "450px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "24px",
                    padding: "32px",
                    textAlign: "center",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                }}
            >
                <div
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: "rgba(0,212,255,0.1)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                    }}
                >
                    <Edit3 size={30} />
                </div>
                <h2
                    style={{
                        fontSize: "22px",
                        fontWeight: 900,
                        marginBottom: "12px",
                        color: "white",
                    }}
                >
                    경로를 재설정하시겠습니까?
                </h2>
                <p
                    style={{
                        opacity: 0.7,
                        marginBottom: "32px",
                        lineHeight: 1.6,
                        fontSize: "15px",
                    }}
                >
                    선택한 여행의 장소 선택 단계로 이동합니다.
                    <br />
                    기존 동선 순서는 초기화되며, AI가 새로운 최적의 경로를 제안합니다.
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={() => setIsReEditModalOpen(false)}
                        style={{
                            flex: 1,
                            padding: "16px",
                            borderRadius: "16px",
                            background: "rgba(255,255,255,0.05)",
                            color: "white",
                            border: "none",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={() => {
                            if (tripToEdit) {
                                setPlannerData({
                                    title: tripToEdit.metadata.title,
                                    destination: tripToEdit.metadata.destination,
                                    startDate: tripToEdit.metadata.startDate,
                                    endDate: tripToEdit.metadata.endDate,
                                    arrivalTime: "10:00",
                                    departureTime: "18:00",
                                    departurePoint: "",
                                    entryPoint: "",
                                    travelMode: "plane",
                                    useRentalCar: tripToEdit.metadata.useRentalCar || false,
                                    companion: "",
                                    transport: tripToEdit.metadata.useRentalCar
                                        ? "rental"
                                        : "bus", // Simplification
                                    pace: "standard",
                                    theme: "",
                                    accommodations: tripToEdit.metadata.accommodations || [],
                                });

                                // Load existing places from the trip into dynamicAttractions
                                const existingPlaces = tripToEdit.points.map((p: any) => ({
                                    id: p.id,
                                    name: p.name,
                                    category: p.category || "custom", // Simplification
                                    lat: p.location.lat,
                                    lng: p.location.lng,
                                    desc: p.memo || "",
                                    priceLevel: "Moderate",
                                    rating: 0,
                                    reviewCount: 0,
                                    longDesc: "",
                                    address: "",
                                    duration: p.timeSpent || 60,
                                    access: p.access || "",
                                    history: p.history || "",
                                    attractions: p.attractions || [],
                                }));

                                setDynamicAttractions(existingPlaces);

                                const existingIds = tripToEdit.points.map((p: any) => p.id);
                                setSelectedPlaceIds(existingIds);
                                setAttractionCategoryFilter("all"); // Request: Default to 'all'

                                // Fetch additional attractions if needed
                                fetchAttractionsWithAI(tripToEdit.metadata.destination);

                                setIsPlanning(true);
                                setPlannerStep(4); // Was 7 in some versions, but 4 is attraction selection
                                setIsReEditModalOpen(false);
                                // Keep tripToEdit for save logic
                            }
                        }}
                        style={{
                            flex: 1,
                            padding: "16px",
                            borderRadius: "16px",
                            background: "var(--primary)",
                            color: "black",
                            border: "none",
                            fontWeight: 800,
                            cursor: "pointer",
                        }}
                    >
                        확인
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
