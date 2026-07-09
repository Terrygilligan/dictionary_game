# Event-Driven Architecture Blueprint
*A Blueprint for Immutable, Scalable, and AI-Ready Systems*

## 1. Core Philosophy: The Event as Truth
In this architecture, the **Event** is the only source of truth. We do not store "current state" directly in the primary database; we store a sequence of immutable events. Current state is derived by replaying these events.

- **Immutability:** Once an event is written to the log, it is never changed or deleted.
- **Traceability:** Every state change in the system is fully auditable.
- **Temporal Insight:** The system can "travel back in time" by replaying events to any point in the past.

## 2. Event Log Structure
Every event must be clearly defined. Each event object should contain:

| Field | Description |
| :--- | :--- |
| `event_id` | Unique UUID for the event. |
| `aggregate_id` | The ID of the entity (e.g., `clinic_001`, `game_session_99`). |
| `event_type` | A descriptive name (e.g., `AppointmentScheduled`, `WordGuessed`). |
| `payload` | The data associated with the event. |
| `timestamp` | ISO-8601 timestamp. |

## 3. The Multi-Tenant Silo Strategy
To keep data separated (e.g., across clinics or game players), every event must be scoped by a `tenant_id` or `aggregate_id`.

*   **Logic:** Centralized engine.
*   **Data:** Private silo.
*   **Implementation:** Every query must filter by `tenant_id` to ensure isolation at the database/storage level.

## 4. AI-Ready Integration (RAG & Agents)
This architecture is designed for AI agents to participate in the system as producers and consumers:

*   **RAG (Retrieval-Augmented Generation):** AI queries the projections (the "current state") and the event log to gain context.
*   **Projections:** AI monitors the event stream to build "Player Profiles," "Clinical Histories," or "Difficulty Scores" without needing to retrain the model.
*   **Agentic Action:** The AI acts as a producer, emitting events (e.g., `[RescheduleAppointment]`) that the system then processes as if a human had performed the action.

## 5. Development Workflow (Windsurf & Python)
1.  **Define Schema:** Start by drafting your `EventSchemas` in a dedicated `/events` directory.
2.  **Implementation:** Build handlers that transform these events into projections.
3.  **Deployment:** Use Google Cloud services (e.g., Pub/Sub, Cloud Run) to handle the event streams asynchronously.
4.  **Audit:** Use the event log for all system debugging and AI-driven performance optimization.

## 6. Implementation Checklist
- [ ] Define all `EventTypes` for the application.
- [ ] Implement an `EventStore` interface.
- [ ] Establish the `Projection` logic for current state.
- [ ] Define the `Tenant Isolation` policy.
- [ ] Connect the `AI Agent` as a subscriber/producer to the stream.
