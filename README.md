# CareRound — Digital Ward Management System

> **Coding Agent Context Document** — This README contains every finalized architectural decision, data model, workflow, and implementation detail for the CareRound system. Read this fully before writing any code.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Decision](#2-architecture-decision)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Domain Modules](#5-domain-modules)
6. [Database Topology](#6-database-topology)
7. [All Entities](#7-all-entities)
8. [All Enums](#8-all-enums)
9. [Actors and Permissions](#9-actors-and-permissions)
10. [Workflows](#10-workflows)
11. [Kafka Event Catalogue](#11-kafka-event-catalogue)
12. [API Endpoints](#12-api-endpoints)
13. [Business Rules](#13-business-rules)
14. [Coding Standards](#14-coding-standards)
15. [Local Environment](#15-local-environment)
16. [Production Concerns](#16-production-concerns)

---

## 1. System Overview

CareRound is a **multi-tenant, production-grade digital ward management platform** for hospitals. It digitises the full lifecycle of inpatient care: patient admission and team assignment, shift management and handovers, daily ward rounds with patient prioritisation, nursing care tasks, clinical documentation, patient deterioration detection via NEWS2 score, and automated next-of-kin notification.

**Multi-tenancy:** Every hospital is an independent tenant. All data is scoped by `hospitalId`. A user from Hospital A cannot access data from Hospital B under any circumstance.

**Domain context:** The system models real clinical workflows. Patients are assigned to consultant-led medical teams (firms) based on specialty and on-call rotations. Ward rounds are prioritised by patient acuity and NEWS score. Shifts are auto-created from schedules. Handovers are first-class entities because shift change is the highest-risk moment in patient care.

---

## 2. Architecture Decision

### Final Decision: Modular Monolith — NOT microservices

This decision is final and must not be reversed. The reasoning:

- Two-person team, eleven-day build timeline, live demo format
- Domain is tightly coupled — a ward round touches shift, patient, review, note, and care task in one operation
- Hospital ward management operates at human scale, not social media scale
- A complete, observable, well-tested monolith is more impressive than a half-finished distributed system
- The presentation argument: "We evaluated microservices and rejected them deliberately. The domain coupling would have required five synchronous service calls per round creation. Instead we built a modular monolith with the same reliability patterns: Transactional Outbox, Quartz JDBC clustering, Redis rate limiting, DLT handling, and clean module boundaries that are microservices-extractable in 2–3 days if scale demands it."

### What is NOT included

- No API Gateway (Spring Security handles JWT directly)
- No CQRS with separate read store (not justified by read/write patterns)
- No Event Sourcing (Transactional Outbox + Audit Consumer already provides the audit trail)
- No service mesh, gRPC, Saga orchestrator, or Debezium
- No Elasticsearch (MySQL with indexes handles all search at this scale)

### Why Notification and Audit are separate processes

These two have a legitimate reason to be independent:
- `careround-notification` calls external APIs (email, SMS) that fail and throttle — a slow email provider must not affect round creation response times. DLT handling is isolated here.
- `careround-audit` writes compliance records independently — audit log writes must never block clinical operations.
- Both are pure Kafka consumers with no HTTP API surface.

---

## 3. Tech Stack

| Concern | Technology | Version |
|---|---|---|
| Language | Java | 21 |
| Framework | Spring Boot | 3.3.5 |
| Security | Spring Security | 6.x (via Spring Boot) |
| ORM | Spring Data JPA / Hibernate | via Spring Boot |
| Database | MySQL | 8.0 |
| Schema Migrations | Flyway | 10.x (via Spring Boot) |
| Connection Pool | HikariCP | via Spring Boot |
| Messaging | Apache Kafka | 3.7 (KRaft mode) |
| Scheduled Jobs | Quartz Scheduler (JDBC clustered) | via spring-boot-starter-quartz |
| Cache / Rate Limiting | Redis | 7 |
| Circuit Breakers | Resilience4j | via spring-cloud-starter-circuitbreaker-resilience4j |
| Auth | JWT | jjwt 0.12.5 |
| Metrics | Micrometer + Prometheus | via spring-boot-starter-actuator |
| Dashboards | Grafana | latest |
| Logging | Logback JSON encoder | logstash-logback-encoder 7.4 |
| Build | Maven | 3.9+ |
| Boilerplate | Lombok | 1.18.34 |
| Mapping | MapStruct | 1.5.5.Final |
| Frontend | React (Vite) | Node 20 LTS |

---

## 4. Project Structure

### Monorepo layout

```
careround/
├── pom.xml                          ← parent POM (dependencyManagement only)
├── docker-compose.yml               ← infrastructure: MySQL, Redis, Kafka, Grafana
├── docker-compose.full.yml          ← everything including apps (demo day)
├── .env                             ← environment variables (never committed)
├── .env.example                     ← committed with dummy values
├── infra/
│   ├── mysql/init.sql               ← creates 3 schemas + grants
│   ├── prometheus/prometheus.yml    ← scrapes /actuator/prometheus from all 3 services
│   └── grafana/
│       ├── datasources/prometheus.yml
│       └── dashboards/careround.json
├── careround-core/                  ← main Spring Boot application (port 8080)
├── careround-notification/          ← Kafka consumer service (port 8081)
└── careround-audit/                 ← Kafka consumer service (port 8082)
```

### Parent POM responsibility

The parent POM uses `<dependencyManagement>` only. It pins versions for: Spring Boot BOM, jjwt, Lombok, MapStruct. All three child projects inherit from it. This prevents version drift between projects, which is critical because they share Kafka topics and must use the same serialiser versions.

### careround-core internal structure

```
careround-core/src/main/java/com/careround/
├── CareRoundApplication.java
│
├── auth/                            ← Domain Module 1
│   ├── controller/
│   │   ├── AuthController.java
│   │   └── UserController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   └── UserService.java
│   ├── repository/
│   │   └── UserRepository.java
│   ├── entity/
│   │   └── User.java
│   └── dto/
│       ├── LoginRequest.java
│       ├── LoginResponse.java
│       ├── RefreshTokenRequest.java
│       ├── CreateUserRequest.java
│       └── UserResponse.java
│
├── hospital/                        ← Domain Module 2
│   ├── ward/
│   │   ├── controller/WardController.java
│   │   ├── service/WardService.java
│   │   ├── repository/WardRepository.java
│   │   ├── entity/Ward.java
│   │   └── dto/CreateWardRequest.java, WardResponse.java, WardDashboardResponse.java
│   ├── department/
│   │   └── (same structure)
│   ├── medicalteam/
│   │   ├── controller/MedicalTeamController.java
│   │   ├── service/MedicalTeamService.java
│   │   ├── repository/MedicalTeamRepository.java, MedicalTeamInviteRepository.java
│   │   ├── entity/MedicalTeam.java, MedicalTeamWard.java, MedicalTeamMember.java, MedicalTeamInvite.java
│   │   └── dto/...
│   ├── shift/
│   │   └── (Shift, Handover, PatientHandoverNote)
│   ├── handover/
│   ├── oncall/
│   │   └── (OnCallRotation, ShiftSchedule)
│   └── hospital/
│       └── (Hospital, SystemConfiguration)
│
├── patient/                         ← Domain Module 3
│   ├── patient/
│   │   ├── controller/PatientController.java
│   │   ├── service/PatientService.java
│   │   ├── repository/PatientRepository.java
│   │   ├── entity/Patient.java
│   │   └── dto/...
│   ├── vitals/
│   │   └── (PatientVitals + NewsScoreService)
│   ├── round/
│   │   └── (Round, PatientRoundReview)
│   ├── caretask/
│   │   └── (CareTask)
│   ├── clinicalnote/
│   │   └── (ClinicalNote)
│   ├── escalation/
│   │   └── (Escalation)
│   └── nextofkin/
│       └── (NextOfKin)
│
├── scheduler/                       ← Quartz jobs (inside core, not separate JVM)
│   ├── config/QuartzConfig.java
│   ├── jobs/
│   │   ├── OutboxPollerJob.java
│   │   ├── OutboxCleanupJob.java
│   │   ├── ShiftCreationJob.java
│   │   ├── TaskOverdueJob.java
│   │   ├── EscalationUnacknowledgedJob.java
│   │   └── InviteExpiryJob.java
│   └── service/JobSchedulingService.java
│
└── shared/                          ← Cross-cutting infrastructure
    ├── config/
    │   ├── SecurityConfig.java
    │   ├── KafkaProducerConfig.java
    │   ├── KafkaTopicConfig.java
    │   └── RedisConfig.java
    ├── entity/
    │   └── BaseEntity.java          ← @MappedSuperclass: id, createdAt, updatedAt
    ├── event/
    │   ├── OutboxEvent.java
    │   ├── OutboxEventRepository.java
    │   └── events/                  ← all 13 Kafka event POJOs (Java records)
    ├── exception/
    │   ├── GlobalExceptionHandler.java
    │   ├── ResourceNotFoundException.java
    │   ├── AccessDeniedException.java
    │   └── BusinessRuleException.java
    ├── security/
    │   ├── JwtAuthFilter.java
    │   ├── JwtService.java
    │   └── HospitalContextHolder.java
    ├── service/
    │   └── OutboxService.java
    ├── dto/
    │   └── ApiResponse.java
    └── validation/
        └── EnumValidator.java
```

### careround-notification structure

```
careround-notification/src/main/java/com/careround/notification/
├── NotificationApplication.java
├── config/
│   ├── KafkaConsumerConfig.java     ← DefaultErrorHandler + DLT config
│   └── KafkaProducerConfig.java     ← needed to publish to DLT
├── consumer/
│   ├── RoundCompletedConsumer.java
│   ├── PatientDeteriorationConsumer.java
│   ├── PatientDischargedConsumer.java
│   ├── TaskOverdueConsumer.java
│   └── ShiftCreatedConsumer.java
├── notification/
│   ├── Notification.java            ← entity (SUCCESSFUL or FAILED)
│   ├── NotificationRepository.java
│   └── NotificationStatus.java       ← enum
├── dlt/
│   └── NotificationDltConsumer.java  ← consumes failed messages, saves as FAILED
└── service/
    └── NotificationService.java
```

### careround-audit structure

```
careround-audit/src/main/java/com/careround/audit/
├── AuditApplication.java
├── config/
│   └── KafkaConsumerConfig.java
├── consumer/
│   └── AuditEventConsumer.java      ← single consumer, all 13 topics
├── entity/
│   └── AuditLogEntry.java
└── repository/
    └── AuditLogRepository.java
```

---

## 5. Domain Modules

### Module boundary rule — CRITICAL

Within careround-core, domain modules must not import repositories from other modules. If `round/` needs patient data, it calls `PatientService` — never `PatientRepository` directly. This enforces the same boundary that would exist between microservices, making future extraction a targeted operation rather than a full refactor.

### Scheduler inside careround-core

The Quartz scheduler runs inside careround-core, not in a separate JVM. When multiple instances of careround-core run horizontally, Quartz JDBC clustered mode ensures each job fires on exactly one instance. Configure in application.yml:

```yaml
spring:
  quartz:
    job-store-type: jdbc
    jdbc:
      initialize-schema: never
    properties:
      org.quartz.jobStore.isClustered: true
      org.quartz.jobStore.clusterCheckinInterval: 10000
      org.quartz.jobStore.driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
      org.quartz.threadPool.threadCount: 5
```

The `QRTZ_*` tables in MySQL (created via Flyway V13) and the `QRTZ_LOCKS` table provide distributed locking. No ShedLock needed — Quartz handles cluster safety natively.

---

## 6. Database Topology

```
MySQL 8 (single server, port 3306)
├── careround_core          ← all domain tables + QRTZ_* + outbox_event
├── careround_notification  ← failed_notifications only
└── careround_audit         ← audit_log only
```

One MySQL user (`careround`) has full privileges on all three schemas. Each Spring Boot application points its datasource URL at its own schema. Each runs its own Flyway migration set. No cross-schema SQL joins ever.

### HikariCP configuration

```yaml
# careround-core
hikari:
  pool-name: CorePool
  maximum-pool-size: 10
  minimum-idle: 5
  connection-timeout: 30000
  idle-timeout: 600000
  max-lifetime: 1800000

# careround-notification and careround-audit
hikari:
  maximum-pool-size: 5
  minimum-idle: 2
```

At 3 instances of careround-core + 1 each of notification and audit:
`(3 × 10) + (1 × 5) + (1 × 5) = 40 connections` — well within MySQL's default `max_connections: 151`.

---

## 7. All Entities

All entities extend `BaseEntity` which provides: `String id` (UUID, set in `@PrePersist`), `LocalDateTime createdAt`, `LocalDateTime updatedAt`.

Use `VARCHAR(36)` for all ID columns. Use `DATETIME` for timestamps. Use `@Enumerated(EnumType.STRING)` on all enum columns. Lombok `@Getter @Setter @NoArgsConstructor` on all entities.

### Hospital

```
Table: hospital
hospitalId not needed (this IS the tenant root)
name               VARCHAR(255) NOT NULL
address            TEXT
contactEmail       VARCHAR(255) NOT NULL UNIQUE
contactPhone       VARCHAR(50)
```

### SystemConfiguration

```
Table: system_configuration
hospitalId         VARCHAR(36) NOT NULL UNIQUE   ← 1:1 with Hospital
newsAmberThreshold INT NOT NULL DEFAULT 5
newsRedThreshold   INT NOT NULL DEFAULT 7
taskOverdueGraceMinutes INT NOT NULL DEFAULT 30
roundNotificationsEnabled BOOLEAN NOT NULL DEFAULT TRUE
nokNotificationEnabled    BOOLEAN NOT NULL DEFAULT TRUE
```

### User

```
Table: users
hospitalId         VARCHAR(36) NOT NULL
firstName          VARCHAR(100) NOT NULL
lastName           VARCHAR(100) NOT NULL
email              VARCHAR(255) NOT NULL
passwordHash       VARCHAR(255) NOT NULL
role               ENUM(UserRole) NOT NULL
departmentId       VARCHAR(36) nullable
isActive           BOOLEAN NOT NULL DEFAULT TRUE

UNIQUE INDEX: (hospital_id, email)
```

### Department

```
Table: department
hospitalId            VARCHAR(36) NOT NULL
name                  VARCHAR(255) NOT NULL
headOfDepartmentId    VARCHAR(36) nullable  ← FK to users
```

### Ward

```
Table: ward
hospitalId    VARCHAR(36) NOT NULL
name          VARCHAR(255) NOT NULL
specialty     VARCHAR(100)
totalBeds     INT NOT NULL DEFAULT 0
supervisorId  VARCHAR(36) nullable  ← FK to users
```

### MedicalTeam

```
Table: medical_team
hospitalId    VARCHAR(36) NOT NULL
name          VARCHAR(255) NOT NULL
consultantId  VARCHAR(36) NOT NULL  ← FK to users
departmentId  VARCHAR(36) NOT NULL  ← FK to department
```

### MedicalTeamWard (join table)

```
Table: medical_team_ward
Composite PK: (medical_team_id, ward_id)
medicalTeamId  VARCHAR(36) NOT NULL
wardId         VARCHAR(36) NOT NULL
assignedAt     DATETIME NOT NULL
No BaseEntity extension — composite PK only
```

### MedicalTeamMember (join table)

```
Table: medical_team_member
Composite PK: (medical_team_id, user_id)
medicalTeamId  VARCHAR(36) NOT NULL
userId         VARCHAR(36) NOT NULL
joinedAt       DATETIME NOT NULL
No BaseEntity extension — composite PK only
```

### MedicalTeamInvite

```
Table: medical_team_invite
hospitalId       VARCHAR(36) NOT NULL
medicalTeamId    VARCHAR(36) NOT NULL
invitedUserId    VARCHAR(36) NOT NULL
invitedById      VARCHAR(36) NOT NULL  ← Consultant who sent invite
status           ENUM(InviteStatus) NOT NULL DEFAULT PENDING
expiresAt        DATETIME NOT NULL
```

### OnCallRotation

```
Table: on_call_rotation
hospitalId    VARCHAR(36) NOT NULL
departmentId  VARCHAR(36) NOT NULL
wardId        VARCHAR(36) nullable     ← optional ward-level override
doctorId      VARCHAR(36) NOT NULL
role          ENUM(OnCallRole) NOT NULL
startTime     DATETIME NOT NULL
endTime       DATETIME NOT NULL
```

### ShiftSchedule

```
Table: shift_schedule
hospitalId   VARCHAR(36) NOT NULL
wardId       VARCHAR(36) nullable   ← null = applies to ALL wards in hospital
shiftType    ENUM(ShiftType) NOT NULL
startTime    TIME NOT NULL           ← e.g. 07:00:00
endTime      TIME NOT NULL           ← e.g. 19:00:00
daysOfWeek   VARCHAR(50) NOT NULL    ← comma-separated: MON,TUE,WED,THU,FRI
isActive     BOOLEAN NOT NULL DEFAULT TRUE
```

### Shift

```
Table: shift
wardId            VARCHAR(36) NOT NULL
shiftScheduleId   VARCHAR(36) nullable    ← null if manually created
type              ENUM(ShiftType) NOT NULL
startTime         DATETIME NOT NULL
endTime           DATETIME NOT NULL
leadDoctorId      VARCHAR(36) nullable    ← set by WardSupervisor on assignment
nurseInChargeId   VARCHAR(36) nullable    ← set by WardSupervisor on assignment
status            ENUM(ShiftStatus) NOT NULL DEFAULT PENDING_ASSIGNMENT
assignedAt        DATETIME nullable

UNIQUE INDEX: (ward_id, type, start_time)
```

### Handover

```
Table: handover
wardId            VARCHAR(36) NOT NULL
outgoingShiftId   VARCHAR(36) NOT NULL
incomingShiftId   VARCHAR(36) NOT NULL
conductedById     VARCHAR(36) NOT NULL
status            ENUM(HandoverStatus) NOT NULL DEFAULT PENDING
generalNotes      TEXT nullable
completedAt       DATETIME nullable
```

### PatientHandoverNote

```
Table: patient_handover_note
handoverId          VARCHAR(36) NOT NULL
patientId           VARCHAR(36) NOT NULL
statusSummary       TEXT
outstandingTaskIds  TEXT nullable    ← comma-separated CareTask UUIDs
urgencyFlag         BOOLEAN NOT NULL DEFAULT FALSE
addedById           VARCHAR(36) NOT NULL
```

### Patient

```
Table: patient
hospitalId              VARCHAR(36) NOT NULL
wardId                  VARCHAR(36) NOT NULL
bedNumber               VARCHAR(20) nullable
medicalTeamId           VARCHAR(36) NOT NULL
admittingConsultantId   VARCHAR(36) nullable
firstName               VARCHAR(100) NOT NULL
lastName                VARCHAR(100) NOT NULL
dateOfBirth             DATE NOT NULL
gender                  VARCHAR(20) nullable
hospitalNumber          VARCHAR(50) NOT NULL UNIQUE
admissionDate           DATETIME NOT NULL
admissionType           ENUM(AdmissionType) NOT NULL
primaryDiagnosis        TEXT nullable
specialtyRequired       VARCHAR(100) nullable   ← matched to Department for on-call routing
acuityLevel             ENUM(AcuityLevel) NOT NULL DEFAULT LOW
newsScore               INT NOT NULL DEFAULT 0  ← computed from latest vitals
isDischargeReady        BOOLEAN NOT NULL DEFAULT FALSE
estimatedDischargeDate  DATE nullable
status                  ENUM(PatientStatus) NOT NULL DEFAULT ADMITTED

INDEX: (hospital_id, ward_id, acuity_level, news_score)
```

### PatientVitals

```
Table: patient_vitals
patientId           VARCHAR(36) NOT NULL
recordedById        VARCHAR(36) NOT NULL
heartRate           INT nullable
respiratoryRate     INT nullable
oxygenSaturation    DECIMAL(5,2) nullable
systolicBP          INT nullable
temperature         DECIMAL(4,1) nullable
consciousnessLevel  ENUM(ConsciousnessLevel) nullable
newsScore           INT NOT NULL    ← computed server-side via NEWS2 algorithm
recordedAt          DATETIME NOT NULL

INDEX: (patient_id, recorded_at)
```

### NextOfKin

```
Table: next_of_kin
patientId               VARCHAR(36) NOT NULL
name                    VARCHAR(255) NOT NULL
relationship            VARCHAR(100) nullable
phone                   VARCHAR(50) nullable
email                   VARCHAR(255) nullable
preferredContactMethod  ENUM(ContactMethod) NOT NULL DEFAULT SMS
isEmergencyContact      BOOLEAN NOT NULL DEFAULT FALSE
notificationConsent     BOOLEAN NOT NULL DEFAULT FALSE   ← GDPR gate
```

### Escalation

```
Table: escalation
hospitalId      VARCHAR(36) NOT NULL
patientId       VARCHAR(36) NOT NULL
triggeredById   VARCHAR(36) nullable    ← null when System-triggered
triggerType     ENUM(EscalationTrigger) NOT NULL
severity        ENUM(EscalationSeverity) NOT NULL
assignedToId    VARCHAR(36) nullable
status          ENUM(EscalationStatus) NOT NULL DEFAULT OPEN
notes           TEXT nullable
resolvedAt      DATETIME nullable
```

### Round

```
Table: round
hospitalId      VARCHAR(36) NOT NULL
wardId          VARCHAR(36) NOT NULL
medicalTeamId   VARCHAR(36) NOT NULL
shiftId         VARCHAR(36) NOT NULL
roundType       ENUM(RoundType) NOT NULL
leadDoctorId    VARCHAR(36) NOT NULL
status          ENUM(RoundStatus) NOT NULL DEFAULT SCHEDULED
scheduledTime   DATETIME nullable
startedAt       DATETIME nullable
completedAt     DATETIME nullable
teamMembers     TEXT nullable   ← comma-separated User UUIDs

INDEX: (ward_id, medical_team_id, round_type, status)
```

### PatientRoundReview

```
Table: patient_round_review
roundId              VARCHAR(36) NOT NULL
patientId            VARCHAR(36) NOT NULL
reviewedById         VARCHAR(36) NOT NULL
reviewOrder          INT NOT NULL          ← 1 = first seen, driven by acuity
newsScoreAtReview    INT nullable          ← snapshot at time of review
clinicalStatus       ENUM(ClinicalStatus) NOT NULL
wasExamined          BOOLEAN NOT NULL DEFAULT FALSE
managementPlan       TEXT nullable
dischargeAssessment  ENUM(DischargeAssessment) NOT NULL DEFAULT NONE
notifiedNextOfKin    BOOLEAN NOT NULL DEFAULT FALSE
reviewedAt           DATETIME NOT NULL
```

### ClinicalNote

```
Table: clinical_note
patientId             VARCHAR(36) NOT NULL
patientRoundReviewId  VARCHAR(36) nullable    ← null for standalone notes
authorId              VARCHAR(36) NOT NULL
noteType              ENUM(NoteType) NOT NULL
content               TEXT NOT NULL
isAmended             BOOLEAN NOT NULL DEFAULT FALSE
amendedById           VARCHAR(36) nullable
amendedAt             DATETIME nullable

NOTE: ClinicalNotes are NEVER deleted. Amendments preserve original.
```

### CareTask

```
Table: care_task
hospitalId       VARCHAR(36) NOT NULL
patientId        VARCHAR(36) NOT NULL
wardId           VARCHAR(36) NOT NULL
roundId          VARCHAR(36) nullable        ← null for NURSING_CARE_PLAN tasks
createdById      VARCHAR(36) NOT NULL
assignedToId     VARCHAR(36) nullable
assignedToRole   ENUM(AssignedToRole) nullable
taskType         VARCHAR(100) NOT NULL        ← free text: "Medication", "Chest X-Ray", etc.
source           ENUM(TaskSource) NOT NULL
title            VARCHAR(255) NOT NULL
description      TEXT nullable
priority         ENUM(TaskPriority) NOT NULL DEFAULT ROUTINE
windowStart      DATETIME nullable
windowEnd        DATETIME nullable
status           ENUM(TaskStatus) NOT NULL DEFAULT PENDING
completedById    VARCHAR(36) nullable
completedAt      DATETIME nullable
escalatedAt      DATETIME nullable

INDEX: (hospital_id, ward_id, status, window_end)
```

### OutboxEvent

```
Table: outbox_event  (in careround_core schema)
hospitalId     VARCHAR(36) NOT NULL
eventType      VARCHAR(100) NOT NULL
payload        LONGTEXT NOT NULL        ← serialised JSON
published      BOOLEAN NOT NULL DEFAULT FALSE
publishedAt    DATETIME nullable
correlationId  VARCHAR(36)

INDEX: (published, created_at)
```

### Notification (careround_notification schema)

```
Table: notifications
eventType       VARCHAR(100) NOT NULL
payload         LONGTEXT NOT NULL
status          ENUM(NotificationStatus) NOT NULL    ← SUCCESSFUL or FAILED
failureReason   TEXT nullable                        ← populated only if status=FAILED
sentAt          DATETIME NOT NULL
retryCount      INT NOT NULL DEFAULT 0
```

### AuditLogEntry (careround_audit schema)

```
Table: audit_log
eventType      VARCHAR(100) NOT NULL
hospitalId     VARCHAR(36) NOT NULL
correlationId  VARCHAR(36)
payload        LONGTEXT
processedAt    DATETIME NOT NULL

INDEX: (hospital_id, event_type, created_at)
```

---

## 8. All Enums

```java
// auth
UserRole: ADMIN, CONSULTANT, REGISTRAR, JUNIOR_DOCTOR, NURSE, WARD_SUPERVISOR

// hospital domain
ShiftType:       DAY, NIGHT
ShiftStatus:     PENDING_ASSIGNMENT, ACTIVE, COMPLETED, HANDED_OVER
HandoverStatus:  PENDING, IN_PROGRESS, COMPLETED
OnCallRole:      REGISTRAR_ON_CALL, CONSULTANT_ON_CALL
InviteStatus:    PENDING, ACCEPTED, DECLINED, EXPIRED

// patient domain
PatientStatus:        ADMITTED, STABLE, DETERIORATING, DISCHARGE_READY, DISCHARGED
AcuityLevel:          LOW, MEDIUM, HIGH, CRITICAL
AdmissionType:        EMERGENCY, ELECTIVE, TRANSFER
ConsciousnessLevel:   ALERT, VOICE, PAIN, UNRESPONSIVE   ← AVPU scale
EscalationTrigger:    HIGH_NEWS_SCORE, TASK_OVERDUE, NURSE_CONCERN, DETERIORATION
EscalationSeverity:   AMBER, RED
EscalationStatus:     OPEN, ACKNOWLEDGED, RESOLVED
ContactMethod:        SMS, EMAIL, BOTH
RoundType:            MORNING, POST_TAKE, BOARD, EVENING, WEEKEND
RoundStatus:          SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
ClinicalStatus:       STABLE, IMPROVING, DETERIORATING, CRITICAL
DischargeAssessment:  NONE, POSSIBLE, CONFIRMED, BLOCKED_SOCIAL, BLOCKED_MEDICAL
NoteType:             ROUND_NOTE, PROGRESS_NOTE, ADMISSION_NOTE, DISCHARGE_NOTE, ESCALATION_NOTE
TaskSource:           NURSING_CARE_PLAN, POST_ROUND_JOB
TaskPriority:         ROUTINE, URGENT, EMERGENCY
TaskStatus:           PENDING, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
AssignedToRole:       NURSE, JUNIOR_DOCTOR, REGISTRAR
```

### AcuityLevel derivation from NEWS score

```
0–4   → LOW
5–6   → MEDIUM (AMBER alert)
7+    → HIGH / CRITICAL (RED alert)
```

---

## 9. Actors and Permissions

### Role overview

| Role | Real-world equivalent | Key scope |
|---|---|---|
| ADMIN | Hospital account administrator | System config, wards, users — no clinical data |
| CONSULTANT | Attending physician | Leads medical team, all clinical authority for own team |
| REGISTRAR | Senior resident | Daily ward management, on-call, round leadership |
| JUNIOR_DOCTOR | Foundation year / resident | Documentation, jobs list, round participation |
| NURSE | Ward nurse | Care tasks, vitals recording, escalation creation |
| WARD_SUPERVISOR | Ward manager / charge nurse | Shift assignment, oversight, dashboard |

### ADMIN — allowed actions

- Create and configure Hospital record
- Manage SystemConfiguration (NEWS thresholds, notification toggles)
- Create/update/deactivate Departments
- Create/update/deactivate Wards
- Create/update/deactivate User accounts (all roles)
- Create and assign MedicalTeams to Wards
- Configure OnCallRotations
- Create and manage ShiftSchedules (automated shift timing)
- **Cannot** view or modify patient records or clinical data

### CONSULTANT — allowed actions

- Create new MedicalTeam (automatically becomes `consultantId`)
- Send MedicalTeamInvites to existing hospital users
- Remove members from own MedicalTeam
- Create and lead Rounds (all types)
- **ONLY role that can confirm discharge** (`dischargeAssessment = CONFIRMED`)
- Create and amend ClinicalNotes for own team's patients
- View all patients assigned to own MedicalTeam
- Create post-round CareTasks assigned to any team role
- **Cannot** access other teams' patients

### REGISTRAR — allowed actions

- Create and lead Rounds (all types, including on-call and weekend)
- Manage on-call admissions — assign patients to MedicalTeams
- Acknowledge and resolve Escalations
- Create post-round CareTasks
- Create and amend ClinicalNotes
- **Cannot** confirm discharge — Consultant only

### JUNIOR_DOCTOR — allowed actions

- Participate in Rounds, create PatientRoundReview records
- Write ClinicalNotes (ROUND_NOTE, PROGRESS_NOTE, DISCHARGE_NOTE)
- Complete assigned post-round CareTasks
- Create PatientHandoverNotes during shift handover
- **Cannot** lead Rounds, confirm discharge, or create NURSING_CARE_PLAN tasks

### NURSE — allowed actions

- Create NURSING_CARE_PLAN CareTasks for any patient on their ward
- Execute and complete CareTasks
- Record PatientVitals — triggers NEWS2 computation
- Create Escalations (triggerType: NURSE_CONCERN)
- Create PatientHandoverNotes
- View ClinicalNotes and PatientRoundReviews (read-only)
- **Cannot** write ClinicalNotes, create Rounds, or confirm discharge

### WARD_SUPERVISOR — allowed actions

- **Assign lead doctor and nurse to PENDING_ASSIGNMENT shifts**
- Initiate and oversee Handovers
- View all CareTasks, completion rates, overdue tasks for their ward
- View all Round histories for their ward
- View all patient records (read-only)
- Receive and action escalation alerts
- Manage bed assignments
- **Cannot** write ClinicalNotes, create Rounds, or confirm discharge

---

## 10. Workflows

### 10.1 Hospital Onboarding

```
Admin registers hospital → Hospital record + SystemConfiguration (defaults) created
→ Admin creates Departments
→ Admin creates Wards (assigns WardSupervisor to each)
→ Admin invites staff (creates User accounts with role + hospitalId)
→ Admin creates ShiftSchedules (time, days, ward target)
→ Consultant creates MedicalTeam → sends invites to Registrar and JuniorDoctors
→ Admin (or Consultant) assigns MedicalTeam to Wards via MedicalTeamWard
→ Admin configures OnCallRotations
→ System is operational
```

### 10.2 Patient Admission

```
WardSupervisor or Admin creates Patient record
  → admissionType: EMERGENCY | ELECTIVE | TRANSFER
  → specialtyRequired: matched to Department

System queries OnCallRotation:
  WHERE department_id = (SELECT id FROM department WHERE name = patient.specialtyRequired)
  AND role = REGISTRAR_ON_CALL (or CONSULTANT_ON_CALL)
  AND start_time <= NOW() AND end_time > NOW()
  → if no match: fall back to General Medicine on-call
  → assigns patient.medicalTeamId

Admission ClinicalNote (ADMISSION_NOTE) created by receiving doctor
Nurse records first PatientVitals → newsScore computed → acuityLevel set
Patient appears on ward list ordered by acuityLevel DESC, newsScore DESC

Outbox publishes → PATIENT_ADMITTED event fires
```

### 10.3 Automatic Shift Creation

```
Quartz ShiftCreationJob runs at configured intervals (every minute)
→ Reads active ShiftSchedule records from database
→ For each schedule matching current day and time:
    Checks uniqueness: (ward_id, type, start_time) must not already exist
    Creates Shift with status = PENDING_ASSIGNMENT
    leadDoctorId = null, nurseInChargeId = null
    Outbox publishes → SHIFT_CREATED event

WardSupervisor receives notification → assigns leadDoctorId + nurseInChargeId
→ PUT /api/v1/shifts/:id/assign
→ Shift status transitions: PENDING_ASSIGNMENT → ACTIVE
→ Outbox publishes → SHIFT_ACTIVATED event

Rounds cannot be created against a PENDING_ASSIGNMENT shift.
Shift must be ACTIVE before rounds begin.
```

### 10.4 MedicalTeam Creation and Invite Flow

```
Consultant creates MedicalTeam:
  POST /api/v1/medical-teams
  → consultantId = authenticated user's ID (auto-set)
  → Must specify departmentId

Consultant sends invite:
  POST /api/v1/medical-teams/:id/invites  { invitedUserId }
  Validates: same hospitalId, not already a member, no duplicate PENDING invite
  Creates MedicalTeamInvite (status: PENDING, expiresAt: now + 48h)
  Outbox publishes → TEAM_INVITE_SENT event

Invited doctor accepts:
  PUT /api/v1/medical-team-invites/:id/accept
  Creates MedicalTeamMember record
  Outbox publishes → TEAM_MEMBER_ADDED event

Quartz InviteExpiryJob: marks PENDING invites past expiresAt as EXPIRED
  Outbox publishes → INVITE_EXPIRED event
```

### 10.5 Ward Round

**Round creation:**
```
Consultant or Registrar creates Round:
  POST /api/v1/rounds  { wardId, roundType, shiftId, teamMembers[] }
  
  Validates:
    - Shift status must be ACTIVE
    - For MORNING rounds: no other MORNING round IN_PROGRESS for same
      wardId + medicalTeamId on same calendar day (409 Conflict if exists)

  Patient queue generated ordered by:
    1. CRITICAL acuity
    2. HIGH acuity (NEWS ≥ 7)
    3. New admissions since last round
    4. MEDIUM acuity
    5. STABLE / LOW acuity

Round status: SCHEDULED
```

**Conducting the round:**
```
Lead doctor starts round: PUT /api/v1/rounds/:id/start
  → status: SCHEDULED → IN_PROGRESS

For each patient in queue:
  JuniorDoctor presents (overnight events, vitals, results)
  Consultant examines patient

  POST /api/v1/rounds/:id/reviews
  Creates PatientRoundReview:
    clinicalStatus, managementPlan, dischargeAssessment, wasExamined
    newsScoreAtReview (snapshot of current score)

  JuniorDoctor writes ClinicalNote (ROUND_NOTE) linked to review
  Post-round CareTasks created (source: POST_ROUND_JOB)
    assigned to specific team members by role
  Patient.newsScore and acuityLevel updated

  If dischargeAssessment = CONFIRMED:
    → Patient.isDischargeReady = true
    → Patient.status = DISCHARGE_READY
    → Auto-creates discharge CareTasks (summary, TTA, bed management)
    → Outbox publishes → PATIENT_DISCHARGE_READY event

All patients reviewed:
  PUT /api/v1/rounds/:id/complete
  Round status: IN_PROGRESS → COMPLETED
  Outbox publishes → ROUND_COMPLETED event (includes all reviewedPatientIds[])
```

**Round type reference:**

| Type | Led by | Scope | Documentation |
|---|---|---|---|
| MORNING | Consultant | All team patients | Full ROUND_NOTE per patient, physical exam |
| POST_TAKE | Registrar | New admissions since last full round | ROUND_NOTE |
| BOARD | Registrar / JuniorDoctor | All ward patients (status check only) | Brief — no exam |
| EVENING | Registrar | Deteriorating or post-procedure | PROGRESS_NOTE |
| WEEKEND | On-call Registrar | All patients across specialty wards | Brief, escalate if needed |

### 10.6 Care Task Lifecycle

**Nursing care task:**
```
Nurse creates: POST /api/v1/care-tasks
  source: NURSING_CARE_PLAN
  taskType: free text ("Medication", "Vitals Check", "Wound Dressing", etc.)
  windowStart, windowEnd set
  assignedToId: Nurse
  status: PENDING

At windowStart: assigned nurse notified
Nurse starts: status → IN_PROGRESS
Nurse completes: status → COMPLETED, completedAt set

If windowEnd passes and status ≠ COMPLETED:
  Quartz TaskOverdueJob fires → TASK_OVERDUE event
  CareTask.escalatedAt set
  Escalation created (triggerType: TASK_OVERDUE)
  WardSupervisor notified
```

**Post-round doctor job:**
```
Created during PatientRoundReview with source: POST_ROUND_JOB
  assignedToRole: JUNIOR_DOCTOR | REGISTRAR | NURSE
  priority: ROUTINE | URGENT | EMERGENCY

EMERGENCY: if not started within 30 minutes → auto-escalate to Registrar
URGENT: if overdue → escalate to Registrar
ROUTINE: if overdue → flag to WardSupervisor only

Status transitions: PENDING → IN_PROGRESS → COMPLETED (forward only, no reversal)
```

### 10.7 Patient Vitals and NEWS2 Deterioration

```
Nurse records vitals: POST /api/v1/patients/:id/vitals
  { heartRate, respiratoryRate, oxygenSaturation, systolicBP,
    temperature, consciousnessLevel }

NewsScoreService computes score via NHS NEWS2 algorithm:
  heartRate:           ≤40 or ≥131 → 3 | 41-50 or 111-130 → 2 | etc.
  respiratoryRate:     ≤8 or ≥25 → 3 | 9-11 → 1 | 12-20 → 0 | etc.
  oxygenSaturation:    ≤91% → 3 | 92-93% → 2 | 94-95% → 1 | ≥96% → 0
  systolicBP:          ≤90 or ≥220 → 3 | etc.
  temperature:         ≤35.0 or ≥39.1 → 2 | etc.
  consciousnessLevel:  ALERT → 0 | any other → 3

Patient.newsScore updated
Patient.acuityLevel updated:
  0-4 → LOW | 5-6 → MEDIUM | 7+ → HIGH / CRITICAL

If score crosses AMBER threshold (default: 5):
  Escalation created (severity: AMBER)
  Assigned to on-call REGISTRAR_ON_CALL for patient's department

If score crosses RED threshold (default: 7):
  Escalation created (severity: RED)
  Assigned to CONSULTANT_ON_CALL
  Patient.status = DETERIORATING
  Outbox publishes → PATIENT_DETERIORATION event
  NextOfKin with isEmergencyContact=true notified (if consent=true)

Quartz EscalationUnacknowledgedJob:
  If escalation not acknowledged within SystemConfiguration.taskOverdueGraceMinutes:
  → Re-assigns to next seniority level
  → Outbox publishes → ESCALATION_UNACKNOWLEDGED event
```

### 10.8 Discharge

```
During PatientRoundReview (Consultant only):
  dischargeAssessment = CONFIRMED (CONSULTANT role enforced at service layer)

Patient.isDischargeReady = true
Patient.status = DISCHARGE_READY
Outbox publishes → PATIENT_DISCHARGE_READY event

Auto-creates CareTasks (source: POST_ROUND_JOB):
  "Write discharge summary"   → assignedToRole: JUNIOR_DOCTOR
  "TTA prescription review"   → assignedToRole: REGISTRAR
  "Notify bed management"     → assignedToRole: WARD_SUPERVISOR

JuniorDoctor creates DISCHARGE_NOTE ClinicalNote

When all discharge CareTasks are COMPLETED:
  Patient.status = DISCHARGED
  wardId and bedNumber cleared (bed freed)
  Outbox publishes → PATIENT_DISCHARGED event
  NextOfKin notified (if notificationConsent = true)

Blocked discharge cases:
  BLOCKED_SOCIAL: awaiting care package — patient stays, flagged on supervisor dashboard
  BLOCKED_MEDICAL: awaiting test result — same
```

### 10.9 Shift Handover

```
Lead doctor initiates: POST /api/v1/handovers
  { outgoingShiftId, incomingShiftId }
  Validates: outgoing shift status must be ACTIVE
  Handover status: PENDING → IN_PROGRESS

For each patient on the ward:
  POST /api/v1/handovers/:id/patient-notes
  { patientId, statusSummary, outstandingTaskIds[], urgencyFlag }

Incoming shift lead signs off:
  PUT /api/v1/handovers/:id/complete
  Handover status → COMPLETED
  Outgoing shift → HANDED_OVER
  Incoming shift → ACTIVE
  Outstanding tasks carry forward (not auto-closed)
  Outbox publishes → HANDOVER_COMPLETED event
```

### 10.10 Next-of-Kin Notification

| Trigger | Event | Content | Condition |
|---|---|---|---|
| Round completed | ROUND_COMPLETED | Confirmation patient was reviewed — no clinical detail | notificationConsent=true AND nokNotificationEnabled=true |
| Patient discharged | PATIENT_DISCHARGED | Discharge confirmed | notificationConsent=true |
| RED deterioration | PATIENT_DETERIORATION | Condition changed, contact ward | isEmergencyContact=true |

---

## 11. Kafka Event Catalogue

All 13 topics use 3 partitions, 1 replica (local dev). All payloads include `hospitalId` and `correlationId`.

| Topic | Published by | Key payload | Consumers |
|---|---|---|---|
| `careround.patient.admitted` | PatientService | patientId, wardId, medicalTeamId | Dashboard, audit |
| `careround.shift.created` | ShiftCreationJob | shiftId, wardId, shiftType | Notification (WardSupervisor alert), audit |
| `careround.shift.activated` | ShiftService | shiftId, wardId, leadDoctorId, nurseInChargeId | Notification, audit |
| `careround.round.completed` | RoundService | roundId, wardId, reviewedPatientIds[] | Notification (NOK fan-out), audit |
| `careround.handover.completed` | HandoverService | handoverId, wardId, incomingShiftId | Notification, audit |
| `careround.task.overdue` | TaskOverdueJob | careTaskId, patientId, wardId, assignedToId, priority | Notification, audit |
| `careround.patient.deterioration` | PatientVitalsService | patientId, wardId, newsScore, severity | Notification (NOK if RED), audit |
| `careround.escalation.unacknowledged` | EscalationUnacknowledgedJob | escalationId, patientId, severity | Notification, audit |
| `careround.patient.discharge-ready` | RoundService | patientId, wardId, estimatedDischargeDate | Notification, audit |
| `careround.patient.discharged` | PatientService | patientId, wardId, nokIds[] | Notification (NOK), audit |
| `careround.team.invite-sent` | MedicalTeamService | inviteId, teamId, invitedUserId | Notification, audit |
| `careround.team.member-added` | MedicalTeamService | teamId, userId | Notification, audit |
| `careround.invite.expired` | InviteExpiryJob | inviteId, teamId, invitedUserId | Notification, audit |

### Transactional Outbox Pattern — mandatory

**NEVER publish directly to Kafka from a service method.** Always:

```java
// Inside a @Transactional service method:
outboxService.publish("careround.round.completed", eventPayload, hospitalId);
// → inserts OutboxEvent row with published=false in SAME transaction

// OutboxPollerJob (Quartz, every ~1 second):
// → reads unpublished outbox rows
// → publishes to Kafka
// → marks published=true
```

This guarantees zero event loss. If Kafka is down, events queue in MySQL and are delivered when Kafka recovers.

### Dead Letter Topic (DLT) — careround-notification only

Kafka `DefaultErrorHandler` in NotificationConsumer config: 3 retries with 1-second backoff, then publish to `<topic>.DLT`. `NotificationDltConsumer` persists failed messages to `notifications` table with `status = FAILED` for inspection.

All notifications (successful and failed) are persisted in the `notifications` table:
- **SUCCESSFUL**: Notification sent successfully by the provider
- **FAILED**: Notification sent to DLT after max retries — requires manual review

### Consumer group IDs

```
careround-notification  ← used by all consumers in careround-notification
careround-audit         ← used by AuditEventConsumer
```

Consumers must be idempotent — check event ID before processing, skip duplicates.

---

## 12. API Endpoints

All endpoints prefixed `/api/v1`. All require JWT Bearer token except auth endpoints. `hospitalId` is always extracted from JWT, never passed as a request parameter.

### Authentication — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Public |
| POST | `/auth/logout` | Authenticated |
| POST | `/auth/change-password` | Authenticated |

### Hospital Management — careround-core (ADMIN only)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/hospitals` | Register new hospital |
| GET | `/hospitals/:id` | Get hospital details |
| PUT | `/hospitals/:id` | Update hospital |
| GET | `/hospitals/:id/config` | Get SystemConfiguration |
| PUT | `/hospitals/:id/config` | Update config (thresholds, toggles) |

### Department Management — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/departments` | ADMIN |
| GET | `/departments` | ADMIN, WARD_SUPERVISOR |
| GET | `/departments/:id` | ADMIN, WARD_SUPERVISOR |
| PUT | `/departments/:id` | ADMIN |
| DELETE | `/departments/:id` | ADMIN |

### Ward Management — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/wards` | ADMIN |
| GET | `/wards` | All clinical staff |
| GET | `/wards/:id` | All clinical staff |
| PUT | `/wards/:id` | ADMIN |
| GET | `/wards/:id/patients` | All clinical staff (ordered by acuity) |
| GET | `/wards/:id/dashboard` | WARD_SUPERVISOR, CONSULTANT |

### Staff Management — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/users` | ADMIN |
| GET | `/users` | ADMIN |
| GET | `/users/:id` | ADMIN, self |
| PUT | `/users/:id` | ADMIN |
| PUT | `/users/:id/deactivate` | ADMIN |
| GET | `/users/me` | Authenticated |
| GET | `/users/me/invites` | Authenticated |

### Medical Team Management — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/medical-teams` | ADMIN, CONSULTANT |
| GET | `/medical-teams` | ADMIN, CONSULTANT |
| GET | `/medical-teams/:id` | ADMIN, team members |
| PUT | `/medical-teams/:id` | ADMIN, owning CONSULTANT |
| DELETE | `/medical-teams/:id/members/:userId` | ADMIN, owning CONSULTANT |
| POST | `/medical-teams/:id/wards` | ADMIN, owning CONSULTANT |
| DELETE | `/medical-teams/:id/wards/:wardId` | ADMIN, owning CONSULTANT |
| POST | `/medical-teams/:id/invites` | Owning CONSULTANT |
| GET | `/medical-teams/:id/invites` | Owning CONSULTANT |
| DELETE | `/medical-teams/:id/invites/:inviteId` | Owning CONSULTANT |
| PUT | `/medical-team-invites/:id/accept` | Invited user |
| PUT | `/medical-team-invites/:id/decline` | Invited user |

### Patient Management — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/patients` | ADMIN, WARD_SUPERVISOR |
| GET | `/patients` | All clinical staff |
| GET | `/patients/:id` | All clinical staff |
| PUT | `/patients/:id` | ADMIN, WARD_SUPERVISOR |
| PUT | `/patients/:id/discharge` | System / REGISTRAR (all discharge tasks complete) |
| GET | `/patients/:id/timeline` | All clinical staff |

### Next-of-Kin — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/patients/:id/next-of-kin` | ADMIN, WARD_SUPERVISOR, NURSE |
| GET | `/patients/:id/next-of-kin` | All clinical staff |
| PUT | `/patients/:id/next-of-kin/:nokId` | ADMIN, WARD_SUPERVISOR |
| DELETE | `/patients/:id/next-of-kin/:nokId` | ADMIN, WARD_SUPERVISOR |

### Patient Vitals — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/patients/:id/vitals` | NURSE |
| GET | `/patients/:id/vitals` | All clinical staff |
| GET | `/patients/:id/vitals/latest` | All clinical staff |

### On-Call Rotation — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/on-call-rotations` | ADMIN |
| GET | `/on-call-rotations` | ADMIN, WARD_SUPERVISOR |
| GET | `/on-call-rotations/current` | All clinical staff |
| PUT | `/on-call-rotations/:id` | ADMIN |
| DELETE | `/on-call-rotations/:id` | ADMIN |

### Shift Schedules — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/shift-schedules` | ADMIN |
| GET | `/shift-schedules` | ADMIN, WARD_SUPERVISOR |
| PUT | `/shift-schedules/:id` | ADMIN |
| PUT | `/shift-schedules/:id/toggle` | ADMIN |
| DELETE | `/shift-schedules/:id` | ADMIN |

### Shift Management — careround-core

| Method | Endpoint | Access |
|---|---|---|
| GET | `/shifts` | WARD_SUPERVISOR, Doctors |
| GET | `/shifts/:id` | WARD_SUPERVISOR, Doctors |
| PUT | `/shifts/:id/assign` | WARD_SUPERVISOR |
| PUT | `/shifts/:id/status` | WARD_SUPERVISOR |
| GET | `/wards/:wardId/shifts/current` | All clinical staff |

### Handover Management — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/handovers` | Lead doctor, WARD_SUPERVISOR |
| GET | `/handovers/:id` | All clinical staff |
| POST | `/handovers/:id/patient-notes` | Any clinical staff on shift |
| PUT | `/handovers/:id/patient-notes/:noteId` | Author only |
| PUT | `/handovers/:id/complete` | Incoming shift lead |
| GET | `/wards/:wardId/handovers` | WARD_SUPERVISOR |

### Ward Rounds — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/rounds` | CONSULTANT, REGISTRAR |
| GET | `/rounds` | All clinical staff |
| GET | `/rounds/:id` | All clinical staff |
| PUT | `/rounds/:id/start` | Round lead doctor |
| PUT | `/rounds/:id/complete` | Round lead doctor |
| PUT | `/rounds/:id/cancel` | Round lead doctor, WARD_SUPERVISOR |
| POST | `/rounds/:id/patient-reviews` | All doctors on round |
| GET | `/rounds/:id/patient-reviews` | All clinical staff |
| PUT | `/rounds/:id/patient-reviews/:reviewId` | Round lead doctor |

### Clinical Notes — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/clinical-notes` | All doctors |
| GET | `/patients/:id/clinical-notes` | All clinical staff |
| GET | `/clinical-notes/:id` | All clinical staff |
| PUT | `/clinical-notes/:id/amend` | Author or senior doctor |

### Care Tasks — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/care-tasks` | NURSE (nursing), DOCTOR (post-round) |
| GET | `/care-tasks` | All clinical staff |
| GET | `/care-tasks/:id` | All clinical staff |
| PUT | `/care-tasks/:id/status` | Assigned staff member |
| PUT | `/care-tasks/:id` | Task creator or senior doctor |
| DELETE | `/care-tasks/:id` | Task creator, REGISTRAR, CONSULTANT |

### Escalations — careround-core

| Method | Endpoint | Access |
|---|---|---|
| POST | `/escalations` | NURSE, any clinical staff |
| GET | `/escalations` | All clinical staff, WARD_SUPERVISOR |
| GET | `/escalations/:id` | All clinical staff |
| PUT | `/escalations/:id/acknowledge` | Assigned doctor |
| PUT | `/escalations/:id/resolve` | Assigned doctor, CONSULTANT |

### Reports — careround-core

| Method | Endpoint | Access |
|---|---|---|
| GET | `/reports/task-completion` | WARD_SUPERVISOR, ADMIN |
| GET | `/reports/overdue-tasks` | WARD_SUPERVISOR, CONSULTANT |
| GET | `/reports/round-history` | WARD_SUPERVISOR, CONSULTANT |
| GET | `/reports/ward-summary` | WARD_SUPERVISOR, CONSULTANT |
| GET | `/reports/patient-flow` | ADMIN, WARD_SUPERVISOR |

---

## 13. Business Rules

These rules are enforced at the **service layer**, not the controller layer. Violation throws `BusinessRuleException` (HTTP 422).

1. **Round MORNING uniqueness:** A MORNING round cannot be created if another MORNING round is `IN_PROGRESS` for the same `wardId + medicalTeamId` on the same calendar day.

2. **Round requires active shift:** A Round cannot be created against a Shift with `status = PENDING_ASSIGNMENT`. Shift must be `ACTIVE`.

3. **Handover requires active shift:** A Handover can only be initiated if the outgoing `Shift.status = ACTIVE`.

4. **Discharge confirmation — Consultant only:** Only a user with `role = CONSULTANT` can set `dischargeAssessment = CONFIRMED`. Any other role attempting this → `AccessDeniedException`.

5. **CareTask forward-only status:** Task status transitions: `PENDING → IN_PROGRESS → COMPLETED` only. Backward transitions are rejected.

6. **ClinicalNotes are immutable:** ClinicalNote records are never deleted. Amendments create a new version alongside the original with `isAmended = true`.

7. **OutboxService inside transaction:** `OutboxService.publish()` must always be called within an existing `@Transactional` context. It inserts an `OutboxEvent` row — never publishes to Kafka directly.

8. **Vitals update patient:** `Patient.newsScore` and `Patient.acuityLevel` are updated on every `PatientVitals` save, within the same transaction.

9. **Invite same hospital:** A `MedicalTeamInvite` can only be sent to a User within the same `hospitalId`.

10. **No duplicate pending invite:** A user cannot receive a duplicate `PENDING` invite to the same `MedicalTeam`.

11. **Invite ownership:** Only the Consultant whose `userId = MedicalTeam.consultantId` can send invites or remove members from that team.

12. **ShiftSchedule idempotency:** `ShiftCreationJob` checks for existing Shift records before creating. Unique constraint `(ward_id, type, start_time)` enforces this at the database level.

13. **Cross-tenant scoping:** `hospitalId` from the authenticated user's JWT must match the `hospitalId` of every entity being accessed. Violations → `AccessDeniedException`.

14. **NEWS thresholds from config:** Alert thresholds are read from `SystemConfiguration` per hospital, never hardcoded.

15. **Cross-module repository access forbidden:** Domain modules within careround-core must not import repositories from other domain modules. Use the service layer for cross-module calls.

---

## 14. Coding Standards

### Dependency injection

```java
// Always use constructor injection via Lombok
@Service
@RequiredArgsConstructor
public class PatientService {
    private final PatientRepository patientRepository;
    private final OutboxService outboxService;
    // Never use @Autowired
}
```

### Transactions

```java
// All write operations
@Transactional
public PatientResponse admit(AdmitPatientRequest request) { ... }

// All read-only operations
@Transactional(readOnly = true)
public PatientResponse getById(String patientId) { ... }
```

### HospitalContextHolder usage

```java
// Populated by JwtAuthFilter from JWT claims
// Read in service layer — never from request parameters
String hospitalId = HospitalContextHolder.getHospitalId();
String userId = HospitalContextHolder.getUserId();
UserRole role = HospitalContextHolder.getRole();

// Always cleared in JwtAuthFilter finally block
// Thread-local: safe for concurrent requests
```

### Controller response format

```java
// All controllers return ResponseEntity<ApiResponse<T>>
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<PatientResponse>> getPatient(@PathVariable String id) {
    PatientResponse patient = patientService.getById(id);
    return ResponseEntity.ok(ApiResponse.ok(patient));
}
```

### Error response format

```json
{
  "status": 404,
  "error": "RESOURCE_NOT_FOUND",
  "message": "Patient not found",
  "path": "/api/v1/patients/abc-123",
  "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2025-05-06T08:00:00Z"
}
```

### Validation

```java
// All request bodies use Jakarta Validation
public record AdmitPatientRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotNull LocalDate dateOfBirth,
    @NotNull AdmissionType admissionType,
    // ...
) {}
```

### Structured logging

```java
// Every significant action logs with MDC fields
log.info("action=ROUND_COMPLETED roundId={} wardId={} patientCount={} durationMs={}",
    roundId, wardId, patientCount, duration);
// MDC is populated by CorrelationIdFilter with correlationId, hospitalId, userId
```

### Micrometer custom counters

```java
// Example: escalation created
Counter.builder("careround.escalation.created")
    .tag("severity", severity.name())
    .tag("hospitalId", hospitalId)
    .register(meterRegistry)
    .increment();
```

### Kafka consumer idempotency

```java
@KafkaListener(topics = "careround.round.completed", groupId = "careround-notification")
@Transactional
public void onRoundCompleted(RoundCompletedEvent event) {
    // Check for duplicate processing
    if (processedEventRepository.existsByEventId(event.getId())) return;
    // Process...
    processedEventRepository.save(new ProcessedEvent(event.getId()));
}
```

---

## 15. Local Environment

### Prerequisites

```
Java 21 JDK (Temurin)     — https://adoptium.net
Maven 3.9+
Docker Desktop
IntelliJ IDEA Community
Node.js 20 LTS + npm
Git
```

### Docker Compose infrastructure

```bash
# Start all infrastructure services
docker compose up -d

# Services started:
#   MySQL 8       → localhost:3306
#   Redis 7       → localhost:6379
#   Kafka 3.7     → localhost:9094 (KRaft, no Zookeeper)
#   Kafka UI      → http://localhost:8090
#   Prometheus    → http://localhost:9090
#   Grafana       → http://localhost:3001 (admin / from .env)
```

### .env file

```env
MYSQL_ROOT_PASSWORD=careround_root
MYSQL_USER=careround
MYSQL_PASSWORD=careround_secret
JWT_SECRET=<256-bit hex string — generate with: openssl rand -hex 32>
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BOOTSTRAP_SERVERS=localhost:9094
GRAFANA_PASSWORD=admin
```

### Running the applications

```bash
# Build from monorepo root
mvn clean install -DskipTests

# Run each service (in separate terminals)
cd careround-core && mvn spring-boot:run -Dspring-boot.run.profiles=dev
cd careround-notification && mvn spring-boot:run -Dspring-boot.run.profiles=dev
cd careround-audit && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# React frontend
cd careround-frontend && npm install && npm run dev
```

### IntelliJ setup

1. File → Open → select `careround/` root (imports all modules via parent POM)
2. File → Project Structure → SDK → Java 21
3. Settings → Build → Compiler → Annotation Processors → **Enable annotation processing** (required for Lombok + MapStruct)
4. Create Run Configurations (Spring Boot) for each service with `Active profiles: dev`
5. Add `.env` file contents as environment variables in each Run Configuration

### Port allocation

```
3000    React frontend (Vite)
3001    Grafana
3306    MySQL
6379    Redis
8080    careround-core
8081    careround-notification
8082    careround-audit
8090    Kafka UI
9090    Prometheus
9094    Kafka (external listener)
```

### Flyway migrations — careround-core

```
V1__create_users.sql
V2__create_hospital_config.sql
V3__create_department_ward.sql
V4__create_medical_team.sql
V5__create_on_call_shift_schedule.sql
V6__create_shift_handover.sql
V7__create_patient.sql
V8__create_vitals_nok.sql
V9__create_escalation.sql
V10__create_round_review.sql
V11__create_clinical_note_care_task.sql
V12__create_outbox.sql
V13__create_quartz_tables.sql   ← full QRTZ_* schema for MySQL
V14__create_indexes.sql         ← all composite indexes
```

---

## 16. Production Concerns

### Composite indexes (V14)

```sql
-- Round queue generation (most critical read path)
CREATE INDEX idx_patient_ward_acuity
  ON patient(hospital_id, ward_id, acuity_level, news_score);

-- Overdue task detection (Quartz job, every minute)
CREATE INDEX idx_care_task_overdue
  ON care_task(hospital_id, ward_id, status, window_end);

-- Outbox poller (every second)
CREATE INDEX idx_outbox_unpublished
  ON outbox_event(published, created_at);

-- On-call rotation lookup (every admission + escalation)
CREATE INDEX idx_on_call_dept_time
  ON on_call_rotation(department_id, start_time, end_time);

-- Current shift lookup
CREATE INDEX idx_shift_ward_status
  ON shift(ward_id, type, status, start_time);

-- Round status check
CREATE INDEX idx_round_ward_team_type
  ON round(ward_id, medical_team_id, round_type, status);

-- Vitals history
CREATE INDEX idx_vitals_patient_time
  ON patient_vitals(patient_id, recorded_at);
```

### Pagination

All list endpoints must use cursor-based pagination:
```
GET /api/v1/patients?wardId=X&limit=20&cursor=<encoded>
```
Never return unbounded lists. A ward with years of round history must not return thousands of rows.

### Graceful shutdown

```yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

### Circuit breakers (careround-notification)

```java
@CircuitBreaker(name = "emailProvider", fallbackMethod = "handleEmailFailure")
public void sendEmail(String to, String subject, String body) { ... }
```

Apply to all external provider calls (email, SMS). Configure: 5 consecutive failures → open for 30 seconds → allow one test call.

### Quartz JDBC clustering (careround-core)

Already covered in Section 5. Critical: `QRTZ_LOCKS` table provides distributed locking. No ShedLock needed. All five Quartz jobs fire on exactly one instance across any number of horizontal cores.

### Redis rate limiting

```java
// In RateLimitingFilter
// Per-hospital sliding window: max 1000 requests/minute per hospitalId
// Per-user: max 100 requests/minute per userId
// Uses Redis INCR + EXPIRE commands
```

### Correlation IDs

Every request gets a `X-Correlation-Id` header (generated by `CorrelationIdFilter` if not present). Stored in MDC for Logback. Included in all Kafka event payloads. Flows from HTTP request → service method → Kafka event → notification/audit consumers → log entries.

### Horizontal scaling

careround-core scales horizontally with zero state changes because:
- JWT is stateless — each instance validates independently
- Redis is shared — rate limit counters are consistent across instances
- MySQL is shared — all instances see the same data
- Quartz JDBC clustering — jobs fire on exactly one instance

Run multiple instances behind a load balancer (round-robin, no sticky sessions needed).
