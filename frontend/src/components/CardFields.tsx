import type { WorkspaceMember } from "../types";
import { DatePicker } from "./ui/DatePicker";
import { errorClass, inputClass, inputErrorClass, labelClass } from "./ui/styles";
import type { CardFormErrors } from "../utils/cardValidation";

export interface CardFieldValues {
  title: string;
  description: string;
  due_date: string;
  assignee_id: string;
}

interface CardFieldsProps {
  values: CardFieldValues;
  errors: CardFormErrors;
  members: WorkspaceMember[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  autoFocusTitle?: boolean;
}

export function CardFields({
  values,
  errors,
  members,
  onTitleChange,
  onDescriptionChange,
  onDueDateChange,
  onAssigneeChange,
  autoFocusTitle,
}: CardFieldsProps) {
  return (
    <>
      <div>
        <label className={labelClass}>Title</label>
        <input
          className={`${inputClass} ${errors.title ? inputErrorClass : ""}`}
          value={values.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Card name"
          autoFocus={autoFocusTitle}
        />
        {errors.title && <p className={errorClass}>{errors.title}</p>}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={`${inputClass} min-h-[100px] resize-y ${errors.description ? inputErrorClass : ""}`}
          value={values.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add a description..."
        />
        {errors.description && <p className={errorClass}>{errors.description}</p>}
      </div>

      <div>
        <label className={labelClass}>Assignee</label>
        <select
          className={inputClass}
          value={values.assignee_id}
          onChange={(e) => onAssigneeChange(e.target.value)}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Due date</label>
        <DatePicker value={values.due_date} onChange={onDueDateChange} disablePast />
        {errors.due_date && <p className={errorClass}>{errors.due_date}</p>}
      </div>
    </>
  );
}
