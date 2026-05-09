import * as React from 'react'
import {ChevronDownIcon} from '@sanity/icons'
import {Button, MenuButton, Menu, MenuItem, MenuDivider, Inline} from '@sanity/ui'

export interface OperatorsMenuButtonProps {
  filter: {
    operator: string
    operatorType?: string
  }
  operator: string
  onOperatorChange: (operator: string) => void
  operators?: Array<{type: 'item' | 'divider'; name?: string}>
}

/**
 * OperatorsMenuButton - Dropdown to select the operator type.
 *
 * Shows available operators for the current filter type.
 */
export function OperatorsMenuButton({
  filter,
  operator,
  onOperatorChange,
  operators,
}: OperatorsMenuButtonProps) {
  // Default operators if none provided
  const defaultOperators: Array<{type: 'item' | 'divider'; name?: string}> = [
    {type: 'item', name: 'includes'},
    {type: 'item', name: 'equals'},
    {type: 'item', name: 'notEquals'},
    {type: 'divider'},
    {type: 'item', name: 'greaterThan'},
    {type: 'item', name: 'lessThan'},
  ]

  const operatorItems = operators || defaultOperators

  // Don't show if only one operator or no operators
  if (!operator || operatorItems.length <= 1) {
    return null
  }

  const currentOperator = operatorItems.find(
    (item) => item.type === 'item' && item.name === operator,
  )

  const operatorText = getOperatorText(operator)

  return (
    <Inline>
      <MenuButton
        id={`operator-menu-${filter.operator || 'default'}`}
        button={<Button mode="ghost" iconRight={ChevronDownIcon} text={operatorText} />}
        menu={
          <Menu>
            {operatorItems.map((item, index) => {
              if (item.type === 'divider') {
                return <MenuDivider key={index} />
              }

              if (item.type === 'item' && item.name) {
                const isSelected = operator === item.name
                return (
                  <MenuItem
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOperatorChange(item.name!)
                    }}
                    pressed={isSelected}
                    text={getOperatorText(item.name)}
                  />
                )
              }

              return null
            })}
          </Menu>
        }
        placement="bottom-start"
        popover={{
          constrainSize: true,
          portal: false,
          radius: 2,
        }}
      />
    </Inline>
  )
}

// Helper to get operator display text
function getOperatorText(operator: string): string {
  const operatorMap: Record<string, string> = {
    includes: 'Contains',
    equals: 'Is',
    notEquals: 'Is not',
    greaterThan: 'Greater than',
    lessThan: 'Less than',
    dateTimeLast: 'In last',
    dateTimeAfter: 'After',
    dateTimeBefore: 'Before',
    dateTimeEqual: 'On',
    dateTimeNotEqual: 'Not on',
    dateTimeRange: 'Between',
    numberRange: 'Between',
    numberEqual: 'Equals',
    numberGt: 'Greater than',
    numberLt: 'Less than',
  }
  return operatorMap[operator] || operator
}
