import {
  Activity,
  CalendarDays,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createProgressEntry,
  deleteProgressEntry,
  getProgressEntries,
} from '../api/forgeApi.js';

import './ProgressPage.css';


/* =========================================
   DATE
========================================= */

function getLocalDateString(
  date = new Date(),
) {
  const offset =
    date.getTimezoneOffset()
    * 60000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 10);
}


/* =========================================
   API NORMALIZATION
========================================= */

function normalizeDate(value) {
  if (!value) {
    return '';
  }

  if (
    typeof value === 'string'
  ) {
    return value.slice(
      0,
      10,
    );
  }

  try {
    return new Date(value)
      .toISOString()
      .slice(
        0,
        10,
      );
  } catch {
    return '';
  }
}


function normalizeNumber(
  value,
) {
  if (
    value === null
    || value === undefined
    || value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : null;
}


function normalizeEntry(
  entry,
) {
  return {
    id:
      entry.id,

    date:
      normalizeDate(
        entry.entry_date
        ?? entry.date,
      ),

    weight:
      normalizeNumber(
        entry.weight_kg
        ?? entry.weight,
      ),

    bodyFat:
      normalizeNumber(
        entry.body_fat_percent
        ?? entry.bodyFat,
      ),

    waist:
      normalizeNumber(
        entry.waist_cm
        ?? entry.waist,
      ),

    chest:
      normalizeNumber(
        entry.chest_cm
        ?? entry.chest,
      ),

    arms:
      normalizeNumber(
        entry.arms_cm
        ?? entry.arms,
      ),

    thighs:
      normalizeNumber(
        entry.thighs_cm
        ?? entry.thighs,
      ),

    notes:
      entry.notes
      ?? '',

    createdAt:
      entry.created_at
      ?? entry.createdAt
      ?? null,
  };
}


function extractEntries(
  response,
) {
  if (
    Array.isArray(response)
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.entries,
    )
  ) {
    return response.entries;
  }

  if (
    Array.isArray(
      response?.progressEntries,
    )
  ) {
    return response.progressEntries;
  }

  if (
    Array.isArray(
      response?.data,
    )
  ) {
    return response.data;
  }

  return [];
}


function sortEntries(
  entries,
) {
  return [
    ...entries,
  ].sort(
    (a, b) => {
      const dateDifference =
        new Date(
          `${b.date}T12:00:00`,
        )
        - new Date(
          `${a.date}T12:00:00`,
        );

      if (
        dateDifference !== 0
      ) {
        return dateDifference;
      }

      return (
        new Date(
          b.createdAt || 0,
        )
        - new Date(
          a.createdAt || 0,
        )
      );
    },
  );
}


/* =========================================
   EMPTY FORM
========================================= */

function createEmptyEntry() {
  return {
    date:
      getLocalDateString(),

    weight: '',
    bodyFat: '',
    waist: '',
    chest: '',
    arms: '',
    thighs: '',
    notes: '',
  };
}


/* =========================================
   PAGE
========================================= */

function ProgressPage() {
  const [
    entries,
    setEntries,
  ] = useState([]);

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(
    createEmptyEntry,
  );

  const [
    error,
    setError,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  /* =========================================
     LOAD PROGRESS
  ========================================= */

  async function loadProgress() {
    await Promise.resolve();

    try {
      setLoading(true);
      setError('');

      const response =
        await getProgressEntries();

      const normalized =
        extractEntries(
          response,
        ).map(
          normalizeEntry,
        );

      setEntries(
        sortEntries(
          normalized,
        ),
      );
    } catch (loadError) {
      console.error(
        'Failed to load progress:',
        loadError,
      );

      setError(
        loadError.message
        || 'Failed to load progress.',
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    const timeoutId =
      setTimeout(() => {
        loadProgress();
      }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);


  /* =========================================
     STATS
  ========================================= */

  const stats =
    useMemo(() => {
      if (
        entries.length === 0
      ) {
        return {
          latestWeight: null,
          weightChange: null,
          latestBodyFat: null,
          totalEntries: 0,
        };
      }

      const latest =
        entries[0];

      const previous =
        entries.find(
          (entry) =>
            entry.id !==
              latest.id
            && entry.weight !==
              null
            && entry.weight !==
              undefined,
        );

      const latestWeight =
        Number.isFinite(
          Number(
            latest.weight,
          ),
        )
          ? Number(
              latest.weight,
            )
          : null;

      const previousWeight =
        previous
        && Number.isFinite(
          Number(
            previous.weight,
          ),
        )
          ? Number(
              previous.weight,
            )
          : null;

      return {
        latestWeight,

        weightChange:
          latestWeight !== null
          && previousWeight !== null
            ? latestWeight
              - previousWeight
            : null,

        latestBodyFat:
          latest.bodyFat !== ''
          && latest.bodyFat !== null
          && latest.bodyFat !==
            undefined
            ? Number(
                latest.bodyFat,
              )
            : null,

        totalEntries:
          entries.length,
      };
    }, [
      entries,
    ]);


  /* =========================================
     OPEN MODAL
  ========================================= */

  function openModal() {
    setForm(
      createEmptyEntry(),
    );

    setError('');
    setShowModal(true);
  }


  /* =========================================
     ADD ENTRY
  ========================================= */

  async function addEntry() {
    if (saving) {
      return;
    }

    if (!form.date) {
      setError(
        'Choose a date.',
      );

      return;
    }

    if (
      form.weight === ''
    ) {
      setError(
        'Enter your weight.',
      );

      return;
    }

    const weight =
      Number(
        form.weight,
      );

    if (
      !Number.isFinite(
        weight,
      )
      || weight <= 0
    ) {
      setError(
        'Enter a valid weight.',
      );

      return;
    }

    const optionalFields = [
      'bodyFat',
      'waist',
      'chest',
      'arms',
      'thighs',
    ];

    for (
      const field of
      optionalFields
    ) {
      if (
        form[field] !== ''
      ) {
        const value =
          Number(
            form[field],
          );

        if (
          !Number.isFinite(
            value,
          )
          || value < 0
        ) {
          setError(
            'Measurements must contain valid positive numbers.',
          );

          return;
        }
      }
    }

    const entry = {
      date:
        form.date,

      weight,

      bodyFat:
        form.bodyFat === ''
          ? null
          : Number(
              form.bodyFat,
            ),

      waist:
        form.waist === ''
          ? null
          : Number(
              form.waist,
            ),

      chest:
        form.chest === ''
          ? null
          : Number(
              form.chest,
            ),

      arms:
        form.arms === ''
          ? null
          : Number(
              form.arms,
            ),

      thighs:
        form.thighs === ''
          ? null
          : Number(
              form.thighs,
            ),

      notes:
        form.notes.trim(),
    };

    try {
      setSaving(true);
      setError('');

      await createProgressEntry(
        entry,
      );

      const response =
        await getProgressEntries();

      const normalized =
        extractEntries(
          response,
        ).map(
          normalizeEntry,
        );

      setEntries(
        sortEntries(
          normalized,
        ),
      );

      setShowModal(
        false,
      );

      setForm(
        createEmptyEntry(),
      );
    } catch (saveError) {
      console.error(
        'Failed to save progress entry:',
        saveError,
      );

      setError(
        saveError.message
        || 'Failed to save measurement.',
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================================
     DELETE ENTRY
  ========================================= */

  async function deleteEntry(
    id,
  ) {
    if (
      deletingId !== null
    ) {
      return;
    }

    try {
      setDeletingId(
        id,
      );

      setError('');

      await deleteProgressEntry(
        id,
      );

      setEntries(
        (current) =>
          current.filter(
            (entry) =>
              entry.id !== id,
          ),
      );
    } catch (deleteError) {
      console.error(
        'Failed to delete progress entry:',
        deleteError,
      );

      setError(
        deleteError.message
        || 'Failed to delete measurement.',
      );
    } finally {
      setDeletingId(
        null,
      );
    }
  }


  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="progress-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page__header">

        <div className="page__header-text">

          <span className="page__eyebrow">
            Body Tracking
          </span>

          <h1 className="page__title">
            Progress
          </h1>

          <p className="page__description">
            Record your body weight
            and measurements over time.
          </p>

        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={
            openModal
          }
          disabled={
            loading
          }
        >
          <Plus size={16} />

          Add Measurement
        </button>

      </div>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && !showModal && (

        <p className="progress-page__error">
          {error}
        </p>

      )}


      {/* =====================================
          SUMMARY
      ===================================== */}

      <section className="progress-page__stats">

        <article className="progress-page__stat">

          <div>
            <Scale size={18} />
          </div>

          <span>
            Current Weight
          </span>

          <strong>
            {
              stats.latestWeight !==
              null
                ? formatNumber(
                    stats.latestWeight,
                  )
                : '—'
            }
          </strong>

          <small>
            {
              stats.latestWeight !==
              null
                ? 'kg'
                : ''
            }
          </small>

        </article>


        <article className="progress-page__stat">

          <div>

            {
              stats.weightChange !==
                null
              && stats.weightChange >
                0 ? (

                <TrendingUp
                  size={18}
                />

              ) : (

                <TrendingDown
                  size={18}
                />

              )
            }

          </div>

          <span>
            Weight Change
          </span>

          <strong>
            {
              stats.weightChange !==
              null
                ? `${
                    stats.weightChange >
                    0
                      ? '+'
                      : ''
                  }${formatNumber(
                    stats.weightChange,
                  )}`
                : '—'
            }
          </strong>

          <small>
            {
              stats.weightChange !==
              null
                ? 'kg'
                : ''
            }
          </small>

        </article>


        <article className="progress-page__stat">

          <div>

            <Activity
              size={18}
            />

          </div>

          <span>
            Body Fat
          </span>

          <strong>
            {
              stats.latestBodyFat !==
              null
                ? formatNumber(
                    stats.latestBodyFat,
                  )
                : '—'
            }
          </strong>

          <small>
            {
              stats.latestBodyFat !==
              null
                ? '%'
                : ''
            }
          </small>

        </article>


        <article className="progress-page__stat">

          <div>

            <CalendarDays
              size={18}
            />

          </div>

          <span>
            Entries
          </span>

          <strong>
            {
              stats.totalEntries
            }
          </strong>

          <small />

        </article>

      </section>


      {/* =====================================
          HISTORY HEADING
      ===================================== */}

      <div className="progress-page__section-header">

        <div>

          <h2>
            Measurement History
          </h2>

          <p>
            Your recorded body
            measurements.
          </p>

        </div>

      </div>


      {/* =====================================
          LOADING
      ===================================== */}

      {loading && (

        <section className="panel progress-page__empty">

          <div>

            <Scale
              size={28}
            />

          </div>

          <h3>
            Loading measurements
          </h3>

          <p>
            Loading your progress
            history from FORGE.
          </p>

        </section>

      )}


      {/* =====================================
          EMPTY STATE
      ===================================== */}

      {!loading
      && entries.length === 0 && (

        <section className="panel progress-page__empty">

          <div>

            <Scale
              size={28}
            />

          </div>

          <h3>
            No measurements yet
          </h3>

          <p>
            Add your current weight
            to start tracking your
            progress.
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={
              openModal
            }
          >
            <Plus size={16} />

            Add First Measurement
          </button>

        </section>

      )}


      {/* =====================================
          HISTORY
      ===================================== */}

      {!loading
      && entries.length > 0 && (

        <section className="panel progress-page__history">

          <div className="progress-page__table-heading">

            <span>
              Date
            </span>

            <span>
              Weight
            </span>

            <span>
              Body Fat
            </span>

            <span>
              Waist
            </span>

            <span>
              Chest
            </span>

            <span>
              Notes
            </span>

            <span />

          </div>


          <div className="progress-page__entries">

            {entries.map(
              (entry) => (

                <article
                  className="progress-page__entry"
                  key={
                    entry.id
                  }
                >

                  <div className="progress-page__entry-date">

                    <strong>
                      {formatDate(
                        entry.date,
                      )}
                    </strong>

                  </div>


                  <span>
                    {
                      entry.weight !==
                      null
                        ? `${formatNumber(
                            entry.weight,
                          )} kg`
                        : '—'
                    }
                  </span>


                  <span>
                    {
                      entry.bodyFat !==
                      null
                        ? `${formatNumber(
                            entry.bodyFat,
                          )}%`
                        : '—'
                    }
                  </span>


                  <span>
                    {
                      entry.waist !==
                      null
                        ? `${formatNumber(
                            entry.waist,
                          )} cm`
                        : '—'
                    }
                  </span>


                  <span>
                    {
                      entry.chest !==
                      null
                        ? `${formatNumber(
                            entry.chest,
                          )} cm`
                        : '—'
                    }
                  </span>


                  <span className="progress-page__notes">
                    {
                      entry.notes
                      || '—'
                    }
                  </span>


                  <button
                    type="button"
                    className="progress-page__delete"
                    aria-label="Delete measurement"
                    disabled={
                      deletingId ===
                      entry.id
                    }
                    onClick={() =>
                      deleteEntry(
                        entry.id,
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />
                  </button>

                </article>

              ),
            )}

          </div>

        </section>

      )}


      {/* =====================================
          ADD MEASUREMENT MODAL
      ===================================== */}

      {showModal && (

        <div
          className="progress-page__overlay"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
              && !saving
            ) {
              setShowModal(
                false,
              );
            }
          }}
        >

          <section
            className="progress-page__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add measurement"
          >

            <div className="progress-page__modal-header">

              <div>

                <span>
                  Body Tracking
                </span>

                <h2>
                  Add Measurement
                </h2>

              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={
                  saving
                }
                onClick={() =>
                  setShowModal(
                    false,
                  )
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="progress-page__form">

              <div className="progress-page__field">

                <label htmlFor="progress-date">
                  Date
                </label>

                <input
                  id="progress-date"
                  type="date"
                  value={
                    form.date
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        date:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>


              <div className="progress-page__field">

                <label htmlFor="progress-weight">
                  Weight (kg)
                </label>

                <input
                  id="progress-weight"
                  autoFocus
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 82.4"
                  value={
                    form.weight
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        weight:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>


              <div className="progress-page__field">

                <label htmlFor="progress-bodyfat">
                  Body Fat (%)
                </label>

                <input
                  id="progress-bodyfat"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Optional"
                  value={
                    form.bodyFat
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        bodyFat:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>


              <div className="progress-page__field">

                <label htmlFor="progress-waist">
                  Waist (cm)
                </label>

                <input
                  id="progress-waist"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Optional"
                  value={
                    form.waist
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        waist:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>


              <div className="progress-page__field">

                <label htmlFor="progress-chest">
                  Chest (cm)
                </label>

                <input
                  id="progress-chest"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Optional"
                  value={
                    form.chest
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        chest:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>


              <div className="progress-page__field">

                <label htmlFor="progress-arms">
                  Arms (cm)
                </label>

                <input
                  id="progress-arms"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Optional"
                  value={
                    form.arms
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        arms:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>


              <div className="progress-page__field">

                <label htmlFor="progress-thighs">
                  Thighs (cm)
                </label>

                <input
                  id="progress-thighs"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Optional"
                  value={
                    form.thighs
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        thighs:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>


              <div className="progress-page__field progress-page__field--full">

                <label htmlFor="progress-notes">
                  Notes
                </label>

                <textarea
                  id="progress-notes"
                  rows="4"
                  placeholder="Optional notes..."
                  value={
                    form.notes
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        notes:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

              </div>

            </div>


            {error && (

              <p className="progress-page__error">
                {error}
              </p>

            )}


            <div className="progress-page__modal-footer">

              <button
                type="button"
                className="button"
                disabled={
                  saving
                }
                onClick={() =>
                  setShowModal(
                    false,
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="button button--primary"
                disabled={
                  saving
                }
                onClick={
                  addEntry
                }
              >
                <Plus size={16} />

                {
                  saving
                    ? 'Saving...'
                    : 'Save Measurement'
                }
              </button>

            </div>

          </section>

        </div>

      )}

    </main>
  );
}


/* =========================================
   FORMATTERS
========================================= */

function formatNumber(
  value,
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number,
    )
  ) {
    return '—';
  }

  return Number.isInteger(
    number,
  )
    ? number.toString()
    : number.toFixed(1);
}


function formatDate(
  date,
) {
  if (!date) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  );
}


export default ProgressPage;