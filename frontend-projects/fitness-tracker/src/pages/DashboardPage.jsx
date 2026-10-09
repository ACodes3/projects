import {
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  Footprints,
  Plus,
  Scale,
  Target,
  TrendingUp,
  Utensils,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './DashboardPage.css';

/* =========================================
   TEMPORARY DASHBOARD DATA

   These will later come from localStorage.
========================================= */

const nutrition = {
  calories: {
    current: 1842,
    target: 2400,
  },
  protein: {
    current: 148,
    target: 180,
  },
  carbs: {
    current: 176,
    target: 250,
  },
  fat: {
    current: 61,
    target: 70,
  },
};

const workout = {
  name: 'Push A',
  exercises: 6,
  estimatedTime: 70,
  status: 'Ready',
};

const recentActivity = [
  {
    id: 1,
    type: 'workout',
    title: 'Pull A',
    detail: '7 exercises · 19 sets',
    time: 'Yesterday',
    icon: Dumbbell,
  },
  {
    id: 2,
    type: 'nutrition',
    title: 'Daily nutrition complete',
    detail: '2,326 kcal · 181g protein',
    time: 'Yesterday',
    icon: Utensils,
  },
  {
    id: 3,
    type: 'weight',
    title: 'Body weight logged',
    detail: '82.4 kg',
    time: '2 days ago',
    icon: Scale,
  },
];

function DashboardPage() {
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const caloriePercentage = Math.min(
    (nutrition.calories.current / nutrition.calories.target) * 100,
    100,
  );

  const proteinPercentage = Math.min(
    (nutrition.protein.current / nutrition.protein.target) * 100,
    100,
  );

  const carbPercentage = Math.min(
    (nutrition.carbs.current / nutrition.carbs.target) * 100,
    100,
  );

  const fatPercentage = Math.min(
    (nutrition.fat.current / nutrition.fat.target) * 100,
    100,
  );

  return (
    <main className="dashboard-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            {today}
          </span>

          <h1 className="page__title">
            Dashboard
          </h1>

          <p className="page__description">
            Your training, nutrition and progress for today.
          </p>

        </div>

        <Link
          to="/workouts"
          className="button button--primary"
        >
          <Dumbbell size={15} />
          Start Workout
        </Link>

      </div>

      {/* =====================================
          TOP SUMMARY
      ===================================== */}

      <section className="dashboard-page__summary">

        {/* TODAY'S WORKOUT */}

        <article className="dashboard-card dashboard-card--workout">

          <div className="dashboard-card__top">

            <div className="dashboard-card__icon">
              <Dumbbell size={19} />
            </div>

            <span className="dashboard-card__status">
              {workout.status}
            </span>

          </div>

          <span className="dashboard-card__label">
            Today&apos;s Workout
          </span>

          <strong className="dashboard-card__value">
            {workout.name}
          </strong>

          <p className="dashboard-card__detail">
            {workout.exercises} exercises · approximately{' '}
            {workout.estimatedTime} min
          </p>

          <Link
            to="/workouts"
            className="dashboard-card__link"
          >
            View workout
            <ArrowRight size={14} />
          </Link>

        </article>

        {/* CALORIES */}

        <article className="dashboard-card">

          <div className="dashboard-card__top">

            <div className="dashboard-card__icon">
              <Flame size={19} />
            </div>

            <span className="dashboard-card__percentage">
              {Math.round(caloriePercentage)}%
            </span>

          </div>

          <span className="dashboard-card__label">
            Calories
          </span>

          <strong className="dashboard-card__value">
            {nutrition.calories.current.toLocaleString()}
          </strong>

          <p className="dashboard-card__detail">
            of {nutrition.calories.target.toLocaleString()} kcal
          </p>

          <div className="dashboard-card__progress">
            <span
              style={{
                width: `${caloriePercentage}%`,
              }}
            />
          </div>

        </article>

        {/* BODY WEIGHT */}

        <article className="dashboard-card">

          <div className="dashboard-card__top">

            <div className="dashboard-card__icon">
              <Scale size={19} />
            </div>

            <span className="dashboard-card__trend">
              -0.4 kg
            </span>

          </div>

          <span className="dashboard-card__label">
            Body Weight
          </span>

          <strong className="dashboard-card__value">
            82.4
            <small> kg</small>
          </strong>

          <p className="dashboard-card__detail">
            Last logged 2 days ago
          </p>

          <Link
            to="/progress"
            className="dashboard-card__link"
          >
            View progress
            <ArrowRight size={14} />
          </Link>

        </article>

        {/* WEEKLY TRAINING */}

        <article className="dashboard-card">

          <div className="dashboard-card__top">

            <div className="dashboard-card__icon">
              <TrendingUp size={19} />
            </div>

            <span className="dashboard-card__trend">
              3 / 4
            </span>

          </div>

          <span className="dashboard-card__label">
            Weekly Training
          </span>

          <strong className="dashboard-card__value">
            3
          </strong>

          <p className="dashboard-card__detail">
            workouts completed this week
          </p>

          <div className="dashboard-page__week">

            <span className="dashboard-page__day dashboard-page__day--done">
              M
            </span>

            <span className="dashboard-page__day dashboard-page__day--done">
              T
            </span>

            <span className="dashboard-page__day">
              W
            </span>

            <span className="dashboard-page__day dashboard-page__day--done">
              T
            </span>

            <span className="dashboard-page__day">
              F
            </span>

            <span className="dashboard-page__day">
              S
            </span>

            <span className="dashboard-page__day">
              S
            </span>

          </div>

        </article>

      </section>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="dashboard-page__grid">

        {/* NUTRITION */}

        <article className="panel dashboard-page__nutrition">

          <div className="panel__header">

            <div>
              <span>Today</span>
              <h2>Nutrition</h2>
            </div>

            <Utensils size={17} />

          </div>

          <div className="dashboard-page__nutrition-content">

            <div className="dashboard-page__calories">

              <div>

                <span>
                  Calories
                </span>

                <strong>
                  {nutrition.calories.current.toLocaleString()}
                  <small>
                    {' '}
                    / {nutrition.calories.target.toLocaleString()} kcal
                  </small>
                </strong>

              </div>

              <div className="dashboard-page__calorie-ring">

                <span>
                  {Math.round(caloriePercentage)}%
                </span>

              </div>

            </div>

            <div className="dashboard-page__macro-list">

              <MacroRow
                label="Protein"
                value={nutrition.protein.current}
                target={nutrition.protein.target}
                percentage={proteinPercentage}
              />

              <MacroRow
                label="Carbs"
                value={nutrition.carbs.current}
                target={nutrition.carbs.target}
                percentage={carbPercentage}
              />

              <MacroRow
                label="Fat"
                value={nutrition.fat.current}
                target={nutrition.fat.target}
                percentage={fatPercentage}
              />

            </div>

            <Link
              to="/nutrition"
              className="dashboard-page__section-link"
            >
              Open nutrition log
              <ArrowRight size={14} />
            </Link>

          </div>

        </article>

        {/* TODAY'S WORKOUT DETAIL */}

        <article className="panel dashboard-page__workout-panel">

          <div className="panel__header">

            <div>
              <span>Training Plan</span>
              <h2>Today&apos;s Workout</h2>
            </div>

            <Dumbbell size={17} />

          </div>

          <div className="dashboard-page__workout-content">

            <div className="dashboard-page__workout-title">

              <div>

                <span>
                  Scheduled Session
                </span>

                <strong>
                  Push A
                </strong>

              </div>

              <span>
                ~70 min
              </span>

            </div>

            <div className="dashboard-page__exercise-preview">

              <WorkoutExercise
                name="Bench Press"
                prescription="3 × 6–8"
              />

              <WorkoutExercise
                name="Incline Dumbbell Press"
                prescription="3 × 8–10"
              />

              <WorkoutExercise
                name="Shoulder Press"
                prescription="3 × 8–10"
              />

              <WorkoutExercise
                name="Lateral Raise"
                prescription="3 × 12–15"
              />

            </div>

            <div className="dashboard-page__remaining">
              + 2 more exercises
            </div>

            <Link
              to="/workouts"
              className="button button--primary dashboard-page__start"
            >
              Start Workout
              <ArrowRight size={14} />
            </Link>

          </div>

        </article>

        {/* QUICK ACTIONS */}

        <article className="panel dashboard-page__quick">

          <div className="panel__header">

            <div>
              <span>Shortcuts</span>
              <h2>Quick Add</h2>
            </div>

            <Plus size={17} />

          </div>

          <div className="dashboard-page__quick-list">

            <Link
              to="/nutrition"
              className="dashboard-page__quick-item"
            >
              <div>
                <Utensils size={17} />
              </div>

              <span>
                Log Food
              </span>

              <Plus size={14} />
            </Link>

            <Link
              to="/progress"
              className="dashboard-page__quick-item"
            >
              <div>
                <Scale size={17} />
              </div>

              <span>
                Log Weight
              </span>

              <Plus size={14} />
            </Link>

            <Link
              to="/workouts"
              className="dashboard-page__quick-item"
            >
              <div>
                <Dumbbell size={17} />
              </div>

              <span>
                New Workout
              </span>

              <Plus size={14} />
            </Link>

            <Link
              to="/library"
              className="dashboard-page__quick-item"
            >
              <div>
                <Target size={17} />
              </div>

              <span>
                Add Exercise
              </span>

              <Plus size={14} />
            </Link>

          </div>

        </article>

        {/* RECENT ACTIVITY */}

        <article className="panel dashboard-page__activity">

          <div className="panel__header">

            <div>
              <span>History</span>
              <h2>Recent Activity</h2>
            </div>

            <CalendarDays size={17} />

          </div>

          <div className="dashboard-page__activity-list">

            {recentActivity.map((activity) => {
              const Icon = activity.icon;

              return (
                <div
                  key={activity.id}
                  className="dashboard-page__activity-item"
                >

                  <div className="dashboard-page__activity-icon">
                    <Icon size={16} />
                  </div>

                  <div className="dashboard-page__activity-content">

                    <strong>
                      {activity.title}
                    </strong>

                    <span>
                      {activity.detail}
                    </span>

                  </div>

                  <small>
                    {activity.time}
                  </small>

                </div>
              );
            })}

          </div>

        </article>

        {/* DAILY TARGETS */}

        <article className="panel dashboard-page__targets">

          <div className="panel__header">

            <div>
              <span>Today</span>
              <h2>Daily Targets</h2>
            </div>

            <Target size={17} />

          </div>

          <div className="dashboard-page__target-list">

            <TargetRow
              icon={Dumbbell}
              label="Workout"
              value="Scheduled"
              complete
            />

            <TargetRow
              icon={Utensils}
              label="Protein"
              value="148 / 180g"
            />

            <TargetRow
              icon={Footprints}
              label="Steps"
              value="7,420 / 10,000"
            />

            <TargetRow
              icon={Scale}
              label="Weight"
              value="Logged"
              complete
            />

          </div>

        </article>

      </section>

    </main>
  );
}

/* =========================================
   MACRO ROW
========================================= */

function MacroRow({
  label,
  value,
  target,
  percentage,
}) {
  return (
    <div className="dashboard-page__macro">

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}g
          <small>
            {' '}
            / {target}g
          </small>
        </strong>

      </div>

      <div className="dashboard-page__macro-bar">
        <span
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

    </div>
  );
}

/* =========================================
   WORKOUT EXERCISE
========================================= */

function WorkoutExercise({
  name,
  prescription,
}) {
  return (
    <div className="dashboard-page__exercise">

      <div>
        <Dumbbell size={14} />
      </div>

      <span>
        {name}
      </span>

      <strong>
        {prescription}
      </strong>

    </div>
  );
}

/* =========================================
   TARGET ROW
========================================= */

function TargetRow({
  icon: Icon,
  label,
  value,
  complete = false,
}) {
  return (
    <div className="dashboard-page__target">

      <div className="dashboard-page__target-icon">
        <Icon size={15} />
      </div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <div
        className={
          complete
            ? 'dashboard-page__target-check dashboard-page__target-check--complete'
            : 'dashboard-page__target-check'
        }
      >
        {complete && (
          <Check size={12} />
        )}
      </div>

    </div>
  );
}

export default DashboardPage;